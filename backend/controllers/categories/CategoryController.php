<?php
class CategoryController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function index() {
        try {
            $sql = "SELECT id, slug, label, sub_label, image_url, parent_id, size_class_id, priority FROM categories ORDER BY priority DESC, label ASC";
            $stmt = $this->pdo->query($sql);
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format for frontend
            $formatted = array_map(function($c) {
                return [
                    'id' => $c['id'],
                    'slug' => $c['slug'],
                    'name' => $c['label'],
                    'subTitle' => $c['sub_label'] ?? '',
                    'image' => $c['image_url'] ?? '',
                    'parentId' => $c['parent_id'],
                    'sizeClassId' => $c['size_class_id'],
                    'priority' => (int)($c['priority'] ?? 0)
                ];
            }, $categories);

            http_response_code(200);
            echo json_encode($formatted);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch categories']);
        }
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['name']) || !isset($data['slug'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        try {
            $sql = "INSERT INTO categories (slug, label, sub_label, image_url, parent_id, size_class_id, priority) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['slug'],
                $data['name'],
                $data['subTitle'] ?? null,
                $data['image'] ?? null,
                $data['parentId'] ?? null,
                $data['sizeClassId'] ?? null,
                $data['priority'] ?? 0
            ]);
            $id = $this->pdo->lastInsertId();
            
            http_response_code(201);
            echo json_encode(['id' => $id, 'message' => 'Category created']);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to create category',
                'details' => $e->getMessage(),
                'sql' => $sql,
                'received_data' => $data
            ]);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid data']);
            return;
        }

        try {
            // Check old image to delete if it was changed
            $stmt = $this->pdo->prepare("SELECT image_url FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            $category = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($category && !empty($category['image_url']) && isset($data['image']) && $category['image_url'] !== $data['image']) {
                require_once __DIR__ . '/../../helpers/CloudinaryHelper.php';
                CloudinaryHelper::deleteImage($category['image_url']);
            }

            $sql = "UPDATE categories SET slug = ?, label = ?, sub_label = ?, image_url = ?, parent_id = ?, size_class_id = ?, priority = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['slug'] ?? '',
                $data['name'] ?? '',
                $data['subTitle'] ?? null,
                $data['image'] ?? null,
                $data['parentId'] ?? null,
                $data['sizeClassId'] ?? null,
                $data['priority'] ?? 0,
                $id
            ]);
            
            http_response_code(200);
            echo json_encode(['message' => 'Category updated']);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update category']);
        }
    }

    public function delete($id) {
        try {
            // First get the image url
            $stmt = $this->pdo->prepare("SELECT image_url FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            $category = $stmt->fetch(PDO::FETCH_ASSOC);

            // Delete from database
            $stmt = $this->pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);

            // If category had an image, delete it from Cloudinary
            if ($category && !empty($category['image_url'])) {
                require_once __DIR__ . '/../../helpers/CloudinaryHelper.php';
                CloudinaryHelper::deleteImage($category['image_url']);
            }
            
            http_response_code(200);
            echo json_encode(['message' => 'Category deleted']);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete category']);
        }
    }
}
