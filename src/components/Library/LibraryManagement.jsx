import { useReducer, useState } from 'react';
import {
  BookOutlined,
  PlusOutlined,
  SearchOutlined,
  SwapOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { getStudents } from '../../data/students';
import {
  borrowBook,
  createBook,
  getBooks,
  getLoans,
  returnLoanQuantity,
  updateBookStock,
} from '../../data/library';

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value));
};

const dateAfterDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const LibraryManagement = () => {
  const [form] = Form.useForm();
  const [borrowForm] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [, refreshData] = useReducer((revision) => revision + 1, 0);
  const [activeTab, setActiveTab] = useState('catalog');
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookToBorrow, setBookToBorrow] = useState(null);
  const [bookToAdjust, setBookToAdjust] = useState(null);
  const books = getBooks();
  const loans = getLoans();
  const students = getStudents();
  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const studentLoans = selectedStudentId
    ? loans.filter((loan) => loan.studentId === selectedStudentId)
    : [];
  const activeStudentLoans = studentLoans.filter((loan) => loan.remainingQuantity > 0);
  const borrowedBookCount = activeStudentLoans.reduce((total, loan) => total + loan.remainingQuantity, 0);

  const filteredBooks = books.filter((book) => {
    const query = search.trim().toLocaleLowerCase('vi');
    const matchesQuery = !query || [book.code, book.title, book.author, book.category]
      .some((value) => value?.toLocaleLowerCase('vi').includes(query));
    const matchesAvailability = availabilityFilter === 'all'
      || (availabilityFilter === 'available' && book.availableQuantity > 0)
      || (availabilityFilter === 'out' && book.availableQuantity === 0);
    return matchesQuery && matchesAvailability;
  });

  const handleCreateBook = (values) => {
    const result = createBook({
      ...values,
      code: values.code.trim(),
      title: values.title.trim(),
      author: values.author.trim(),
      category: values.category.trim(),
    });
    if (!result.saved) {
      message.error(result.reason === 'duplicate'
        ? 'Mã ISBN / mã sách đã tồn tại.'
        : 'Không thể thêm sách vào kho.');
      return;
    }
    message.success('Đã thêm sách vào kho.');
    form.resetFields();
    setIsBookModalOpen(false);
    refreshData();
  };

  const openStockEditor = (book) => {
    setBookToAdjust(book);
    stockForm.setFieldsValue({ totalQuantity: book.totalQuantity });
  };

  const saveStock = ({ totalQuantity }) => {
    const result = updateBookStock(bookToAdjust.id, totalQuantity);
    if (!result.saved) {
      if (result.reason === 'below-borrowed') {
        message.error(`Không thể đặt thấp hơn ${result.borrowedQuantity} quyển đang được mượn.`);
      } else {
        message.error('Không thể cập nhật số lượng sách.');
      }
      return;
    }
    message.success('Đã cập nhật tồn kho.');
    setBookToAdjust(null);
    refreshData();
  };

  const openBorrowModal = (book) => {
    setBookToBorrow(book);
    borrowForm.resetFields();
    borrowForm.setFieldsValue({ quantity: 1, dueDate: dateAfterDays(14) });
  };

  const submitBorrow = (values) => {
    const student = students.find((item) => item.id === values.studentId);
    if (!student || !bookToBorrow) return;
    const result = borrowBook({
      bookId: bookToBorrow.id,
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      quantity: values.quantity,
      dueDate: values.dueDate,
    });
    if (!result.saved) {
      message.error(result.reason === 'unavailable'
        ? `Chỉ còn ${result.availableQuantity} quyển có thể mượn.`
        : 'Không thể lập phiếu mượn.');
      refreshData();
      return;
    }
    message.success(`Đã ghi nhận mượn ${values.quantity} quyển.`);
    setBookToBorrow(null);
    refreshData();
  };

  const returnLoan = (loan) => {
    const result = returnLoanQuantity(loan.id, loan.remainingQuantity);
    if (!result.saved) {
      message.error('Không thể ghi nhận trả sách.');
      return;
    }
    message.success(`Đã nhận trả ${loan.remainingQuantity} quyển.`);
    refreshData();
  };

  const bookColumns = [
    { title: 'Mã sách / ISBN', dataIndex: 'code', key: 'code', width: 160 },
    {
      title: 'Tên sách',
      dataIndex: 'title',
      key: 'title',
      render: (title, book) => (
        <div>
          <Typography.Text strong>{title}</Typography.Text>
          <Typography.Text type="secondary" style={{ display: 'block' }}>{book.author}</Typography.Text>
        </div>
      ),
    },
    { title: 'Thể loại', dataIndex: 'category', key: 'category', width: 150 },
    { title: 'Tổng kho', dataIndex: 'totalQuantity', key: 'totalQuantity', width: 105, align: 'right' },
    { title: 'Đang mượn', dataIndex: 'borrowedQuantity', key: 'borrowedQuantity', width: 115, align: 'right' },
    {
      title: 'Còn trong kho',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 140,
      render: (quantity) => (
        <Space>
          <Typography.Text strong>{quantity}</Typography.Text>
          <Tag color={quantity ? 'green' : 'red'}>{quantity ? 'Còn sách' : 'Hết sách'}</Tag>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 210,
      render: (_, book) => (
        <Space size={0}>
          <Button type="link" disabled={!book.availableQuantity} onClick={() => openBorrowModal(book)}>Cho mượn</Button>
          <Button type="link" onClick={() => openStockEditor(book)}>Cập nhật kho</Button>
        </Space>
      ),
    },
  ];

  const loanColumns = [
    { title: 'Mã phiếu', dataIndex: 'id', key: 'id', width: 110 },
    { title: 'Sách', dataIndex: 'bookTitle', key: 'bookTitle' },
    { title: 'Mượn', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'right' },
    { title: 'Đã trả', dataIndex: 'returnedQuantity', key: 'returnedQuantity', width: 80, align: 'right' },
    { title: 'Còn mượn', dataIndex: 'remainingQuantity', key: 'remainingQuantity', width: 100, align: 'right' },
    { title: 'Ngày mượn', dataIndex: 'borrowedAt', key: 'borrowedAt', render: formatDate, width: 130 },
    { title: 'Hạn trả', dataIndex: 'dueDate', key: 'dueDate', render: formatDate, width: 130 },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 125,
      render: (_, loan) => {
        if (!loan.remainingQuantity) return <Tag>Đã trả</Tag>;
        if (new Date(`${loan.dueDate}T23:59:59`) < new Date()) return <Tag color="red">Quá hạn</Tag>;
        return <Tag color="gold">Đang mượn</Tag>;
      },
    },
    {
      title: '',
      key: 'return',
      width: 110,
      render: (_, loan) => loan.remainingQuantity ? (
        <Popconfirm title={`Nhận trả ${loan.remainingQuantity} quyển?`} onConfirm={() => returnLoan(loan)}>
          <Button type="link">Nhận trả</Button>
        </Popconfirm>
      ) : null,
    },
  ];

  const catalogContent = (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}><Card><Statistic title="Đầu sách" value={books.length} prefix={<BookOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Tổng số quyển" value={books.reduce((sum, book) => sum + book.totalQuantity, 0)} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Đang được mượn" value={books.reduce((sum, book) => sum + book.borrowedQuantity, 0)} prefix={<SwapOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Đầu sách hết" value={books.filter((book) => !book.availableQuantity).length} valueStyle={{ color: '#cf1322' }} /></Card></Col>
      </Row>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          aria-label="Tìm sách"
          placeholder="Tên sách, tác giả, ISBN hoặc thể loại"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 360, maxWidth: '100%' }}
        />
        <Select
          aria-label="Lọc tình trạng sách"
          value={availabilityFilter}
          onChange={setAvailabilityFilter}
          options={[
            { value: 'all', label: 'Tất cả tình trạng' },
            { value: 'available', label: 'Còn sách' },
            { value: 'out', label: 'Hết sách' },
          ]}
          style={{ width: 180 }}
        />
      </div>
      {filteredBooks.length ? (
        <Table rowKey="id" columns={bookColumns} dataSource={filteredBooks} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1050 }} />
      ) : <Empty description="Không tìm thấy sách phù hợp." />}
    </>
  );

  const studentContent = (
    <>
      <div style={{ maxWidth: 520, marginBottom: 20 }}>
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Học sinh</Typography.Text>
        <Select
          showSearch
          allowClear
          aria-label="Tra cứu học sinh mượn sách"
          value={selectedStudentId}
          onChange={setSelectedStudentId}
          options={students.map((student) => ({
            value: student.id,
            label: `${student.id} · ${student.name} · ${student.className}`,
          }))}
          optionFilterProp="label"
          placeholder="Tìm theo mã hoặc tên học sinh"
          style={{ width: '100%' }}
        />
      </div>
      {!selectedStudent ? (
        <Empty description="Chọn học sinh để xem số lượng sách đang mượn và lịch sử." />
      ) : (
        <>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            {selectedStudent.name} <Typography.Text type="secondary">· {selectedStudent.id} · Lớp {selectedStudent.className}</Typography.Text>
          </Typography.Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} md={8}><Card><Statistic title="Sách đang mượn" value={borrowedBookCount} suffix="quyển" /></Card></Col>
            <Col xs={12} md={8}><Card><Statistic title="Phiếu chưa trả hết" value={activeStudentLoans.length} /></Card></Col>
            <Col xs={12} md={8}><Card><Statistic title="Tổng lượt mượn" value={studentLoans.length} /></Card></Col>
          </Row>
          {studentLoans.length ? (
            <Table rowKey="id" columns={loanColumns} dataSource={studentLoans} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1050 }} />
          ) : <Empty description="Học sinh chưa có phiếu mượn sách." />}
        </>
      )}
    </>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: '0 0 4px' }}>Quản lý thư viện</Typography.Title>
          <Typography.Text type="secondary">Kho sách, phiếu mượn và tình trạng mượn theo học sinh.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsBookModalOpen(true)}>Thêm sách</Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'catalog', label: 'Kho sách', children: catalogContent },
          { key: 'students', label: <span><UserOutlined /> Theo học sinh</span>, children: studentContent },
        ]}
      />

      <Modal
        title="Thêm sách vào kho"
        open={isBookModalOpen}
        onCancel={() => setIsBookModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateBook}>
          <Form.Item label="Mã sách / ISBN" name="code" rules={[{ required: true, whitespace: true, message: 'Nhập mã sách hoặc ISBN.' }]}>
            <Input maxLength={40} />
          </Form.Item>
          <Form.Item label="Tên sách" name="title" rules={[{ required: true, whitespace: true, message: 'Nhập tên sách.' }]}>
            <Input maxLength={180} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tác giả" name="author" rules={[{ required: true, whitespace: true, message: 'Nhập tên tác giả.' }]}>
                <Input maxLength={120} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Thể loại" name="category" rules={[{ required: true, whitespace: true, message: 'Nhập thể loại sách.' }]}>
                <Input maxLength={80} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Số lượng nhập kho" name="totalQuantity" rules={[{ required: true, message: 'Nhập số lượng.' }]}>
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Thêm vào kho</Button>
        </Form>
      </Modal>

      <Modal
        title={`Lập phiếu mượn · ${bookToBorrow?.title ?? ''}`}
        open={Boolean(bookToBorrow)}
        onCancel={() => setBookToBorrow(null)}
        onOk={() => borrowForm.submit()}
        okText="Xác nhận mượn"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={borrowForm} layout="vertical" onFinish={submitBorrow}>
          <Form.Item label="Học sinh" name="studentId" rules={[{ required: true, message: 'Chọn học sinh mượn sách.' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={students.map((student) => ({
                value: student.id,
                label: `${student.id} · ${student.name} · ${student.className}`,
              }))}
              placeholder="Tìm theo mã hoặc tên học sinh"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={`Số quyển (còn ${bookToBorrow?.availableQuantity ?? 0})`} name="quantity" rules={[{ required: true, message: 'Nhập số lượng.' }]}>
                <InputNumber min={1} max={bookToBorrow?.availableQuantity} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hạn trả" name="dueDate" rules={[{ required: true, message: 'Chọn hạn trả.' }]}>
                <Input type="date" min={new Date().toISOString().slice(0, 10)} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={`Cập nhật tồn kho · ${bookToAdjust?.title ?? ''}`}
        open={Boolean(bookToAdjust)}
        onCancel={() => setBookToAdjust(null)}
        onOk={() => stockForm.submit()}
        okText="Lưu số lượng"
        cancelText="Hủy"
        destroyOnHidden
      >
        {bookToAdjust && (
          <>
            <Alert
              type="info"
              showIcon
              title={`Đang có ${bookToAdjust.borrowedQuantity} quyển được mượn; tổng kho không thể thấp hơn số này.`}
              style={{ marginBottom: 16 }}
            />
            <Form form={stockForm} layout="vertical" onFinish={saveStock}>
              <Form.Item label="Tổng số quyển trong kho" name="totalQuantity" rules={[{ required: true, message: 'Nhập tổng số lượng.' }]}>
                <InputNumber min={bookToAdjust.borrowedQuantity} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default LibraryManagement;