<?php
class SizeClassController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function index() {
        try {
            $stmt = $this->pdo->query("SELECT * FROM size_classes ORDER BY name ASC");
            $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode sizes JSON
            foreach ($classes as &$c) {
                $c['sizes'] = json_decode($c['sizes'], true);
            }

            http_response_code(200);
            echo json_encode($classes);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch size classes']);
        }
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['name']) || !isset($data['sizes'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        try {
            $sql = "INSERT INTO size_classes (name, sizes) VALUES (?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['name'],
                json_encode($data['sizes'])
            ]);
            $id = $this->pdo->lastInsertId();
            
            http_response_code(201);
            echo json_encode(['id' => $id, 'message' => 'Size class created']);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create size class']);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['name']) || !isset($data['sizes'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        try {
            $sql = "UPDATE size_classes SET name = ?, sizes = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['name'],
                json_encode($data['sizes']),
                $id
            ]);
            
            http_response_code(200);
            echo json_encode(['message' => 'Size class updated']);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update size class']);
        }
    }

    public function delete($id) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM size_classes WHERE id = ?");
            $stmt->execute([$id]);
            
            http_response_code(200);
            echo json_encode(['message' => 'Size class deleted']);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete size class']);
        }
    }
}
