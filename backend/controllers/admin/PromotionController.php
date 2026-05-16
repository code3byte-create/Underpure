<?php

/* 
MySQL CREATE TABLE Statement for promotions:

CREATE TABLE promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    value DECIMAL(10, 2) NOT NULL,
    min_order_value DECIMAL(10, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_promo_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

class PromotionController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Helper to verify admin access
     */
    private function requireAdmin() {
        if (!isset($_REQUEST['user']) || !isset($_REQUEST['user']['role']) || $_REQUEST['user']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            exit();
        }
    }

    /**
     * GET /api/admin/promotions
     * Admin: Fetch all promotions
     */
    public function index() {
        $this->requireAdmin();

        try {
            $stmt = $this->pdo->query("SELECT * FROM promotions ORDER BY created_at DESC");
            $promotions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format numeric and boolean values
            foreach ($promotions as &$promo) {
                $promo['value'] = (float)$promo['value'];
                $promo['min_order'] = (float)$promo['min_order'];
                $promo['uses'] = (int)$promo['uses'];
                $promo['max_uses'] = $promo['max_uses'] !== null ? (int)$promo['max_uses'] : null;
                $promo['active'] = (bool)$promo['active'];
            }

            http_response_code(200);
            echo json_encode($promotions);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/admin/promotions
     * Admin: Create a new promotion
     */
    public function create() {
        $this->requireAdmin();

        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->code) || empty($data->type) || !isset($data->value)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: code, type, value']);
            return;
        }

        try {
            $sql = "INSERT INTO promotions (code, type, value, min_order, max_uses, active, expires) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                trim(strtoupper($data->code)),
                $data->type,
                $data->value,
                $data->minOrder ?? 0,
                $data->maxUses ?? null,
                isset($data->active) ? (int)$data->active : 1,
                $data->expires ?? null
            ]);

            http_response_code(201);
            echo json_encode([
                'message' => 'Promotion created successfully', 
                'id' => $this->pdo->lastInsertId()
            ]);
        } catch (\PDOException $e) {
            // Check for duplicate code
            if ($e->getCode() == 23000) {
                http_response_code(409);
                echo json_encode(['error' => 'Promotion code already exists']);
                return;
            }
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * PUT /api/admin/promotions/{id}
     * Admin: Update an existing promotion
     */
    public function update($id) {
        $this->requireAdmin();

        if (empty($id) || !is_numeric($id)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid promotion ID']);
            return;
        }

        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->code) || empty($data->type) || !isset($data->value)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        try {
            $sql = "UPDATE promotions 
                    SET code = ?, type = ?, value = ?, min_order = ?, max_uses = ?, active = ?, expires = ?
                    WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                trim(strtoupper($data->code)),
                $data->type,
                $data->value,
                $data->minOrder ?? 0,
                $data->maxUses ?? null,
                isset($data->active) ? (int)$data->active : 1,
                $data->expires ?? null,
                $id
            ]);

            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(['message' => 'Promotion updated successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Promotion not found or no changes made']);
            }
        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) {
                http_response_code(409);
                echo json_encode(['error' => 'Promotion code already exists']);
                return;
            }
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /api/admin/promotions/{id}
     * Admin: Delete a promotion
     */
    public function delete($id) {
        $this->requireAdmin();

        if (empty($id) || !is_numeric($id)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid promotion ID']);
            return;
        }

        try {
            $stmt = $this->pdo->prepare("DELETE FROM promotions WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(['message' => 'Promotion deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Promotion not found']);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/checkout/validate-promo
     * Public: Validate promo code and calculate discount
     */
    public function validatePromo() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->code) || !isset($data->subtotal)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing promo code or cart subtotal']);
            return;
        }

        $code = trim(strtoupper($data->code));
        $subtotal = (float)$data->subtotal;

        try {
            $stmt = $this->pdo->prepare("SELECT * FROM promotions WHERE code = ?");
            $stmt->execute([$code]);
            $promo = $stmt->fetch(PDO::FETCH_ASSOC);

            // Check if promo exists
            if (!$promo) {
                http_response_code(404);
                echo json_encode(['error' => 'Invalid promo code']);
                return;
            }

            // Check if it's active
            if (!(bool)$promo['active']) {
                http_response_code(400);
                echo json_encode(['error' => 'Promo code is no longer active']);
                return;
            }

            // Check expiration date
            if (!empty($promo['expires']) && strtotime($promo['expires']) < time()) {
                http_response_code(400);
                echo json_encode(['error' => 'Promo code has expired']);
                return;
            }

            // Check max uses
            if ($promo['max_uses'] !== null && $promo['uses'] >= $promo['max_uses']) {
                http_response_code(400);
                echo json_encode(['error' => 'Promo code usage limit reached']);
                return;
            }

            // Check minimum order value
            if ($subtotal < (float)$promo['min_order']) {
                http_response_code(400);
                echo json_encode(['error' => "Subtotal must be at least {$promo['min_order']} to use this code"]);
                return;
            }

            // Calculate discount
            $discount = 0;
            if ($promo['type'] === 'percentage') {
                $discount = $subtotal * ((float)$promo['value'] / 100);
            } else if ($promo['type'] === 'fixed') {
                $discount = (float)$promo['value'];
            }

            // Prevent discount from exceeding the subtotal
            if ($discount > $subtotal) {
                $discount = $subtotal;
            }

            // Increment uses
            $updateStmt = $this->pdo->prepare("UPDATE promotions SET uses = uses + 1 WHERE id = ?");
            $updateStmt->execute([$promo['id']]);

            http_response_code(200);
            echo json_encode([
                'message' => 'Promo code applied!',
                'code' => $promo['code'],
                'discount_amount' => round($discount, 2),
                'new_total' => round($subtotal - $discount, 2)
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }
}
