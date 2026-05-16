<?php
require_once __DIR__ . '/env.php';
Env::load(__DIR__ . '/../.env');

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port_primary;
    private $port_fallback;
    
    public $conn;

    public function __construct() {
        $this->host = $_ENV['DB_HOST'] ?? "127.0.0.1";
        $this->db_name = $_ENV['DB_NAME'] ?? "underpure_new";
        $this->username = $_ENV['DB_USER'] ?? "root";
        $this->password = $_ENV['DB_PASS'] ?? "";
        $this->port_primary = $_ENV['DB_PORT_PRIMARY'] ?? "3308";
        $this->port_fallback = $_ENV['DB_PORT_FALLBACK'] ?? "3306";
    }

    public function getConnection() {
        $this->conn = null;
        try {
            // First try connecting with primary port
            $this->conn = new PDO("mysql:host=" . $this->host . ";port=" . $this->port_primary . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            try {
                // Try connecting with fallback port
                $this->conn = new PDO("mysql:host=" . $this->host . ";port=" . $this->port_fallback . ";dbname=" . $this->db_name, $this->username, $this->password);
                $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->conn->exec("set names utf8");
            } catch(PDOException $fallbackException) {
                echo json_encode(["error" => "Database Connection Error: " . $fallbackException->getMessage()]);
                exit;
            }
        }
        return $this->conn;
    }
}
?>
