<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/products/ProductController.php';

$_REQUEST['user']['role'] = 'admin'; // Mock admin

// We need an array structure similar to the frontend
$jsonStr = '{"slug":"test-base64","name":"Test Base64","price":10,"colors":[{"name":"Red","images":["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCABQAFADASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAECA//EABwQAQADAAMBAQAAAAAAAAAAAAABAhExQQMSYv/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDaAAzUAoAKgKAAAAAAAA//2Q=="]}],"image":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCABQAFADASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAECA//EABwQAQADAAMBAQAAAAAAAAAAAAABAhExQQMSYv/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDaAAzUAoAKgKAAAAAAAA//2Q=="}';

$_POST = json_decode($jsonStr, true);

// Create mock php://input
file_put_contents('php://memory', $jsonStr); // Wait, this won't work for php://input

// Instead, I can just modify ProductController to use $_POST directly for this test
$controller = new ProductController($pdo);
// Hack to simulate php://input
stream_wrapper_unregister("php");
stream_wrapper_register("php", "MockPhpStream");
class MockPhpStream {
    private $position;
    private $data;
    public function stream_open($path, $mode, $options, &$opened_path) {
        $this->data = $GLOBALS['mock_input_data'];
        $this->position = 0;
        return true;
    }
    public function stream_read($count) {
        $ret = substr($this->data, $this->position, $count);
        $this->position += strlen($ret);
        return $ret;
    }
    public function stream_eof() {
        return $this->position >= strlen($this->data);
    }
}
$GLOBALS['mock_input_data'] = $jsonStr;

$controller->create();
