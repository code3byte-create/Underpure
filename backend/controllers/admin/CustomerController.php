<?php

class CustomerController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * GET /api/admin/customers
     * Fetch all non-admin users with their total orders and lifetime value.
     */
    public function index() {
        // Assume authMiddleware() ran and populated $_REQUEST['user']
        if (!isset($_REQUEST['user']) || !isset($_REQUEST['user']['role']) || $_REQUEST['user']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            return;
        }

        try {
            $sql = "SELECT 
                        u.id, 
                        u.name, 
                        u.email, 
                        u.created_at as joined,
                        COUNT(o.id) as total_orders,
                        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) as lifetime_value,
                        MAX(o.created_at) as lastOrder
                    FROM users u
                    LEFT JOIN orders o ON u.id = o.user_id
                    WHERE u.is_admin = FALSE
                    GROUP BY u.id, u.name, u.email, u.created_at
                    ORDER BY u.created_at DESC";

            $stmt = $this->pdo->query($sql);
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format numeric values and derived fields
            foreach ($customers as &$customer) {
                $customer['orders'] = (int)$customer['total_orders'];
                $customer['totalSpent'] = (float)$customer['lifetime_value'];
                $customer['isVip'] = $customer['totalSpent'] >= 500;
                $customer['status'] = 'active'; // Simplified
                $customer['country'] = "Pakistan";
                $customer['lastOrder'] = $customer['lastOrder'] ? substr($customer['lastOrder'], 0, 10) : "Never";
                $customer['joined'] = substr($customer['joined'], 0, 10);
            }

            http_response_code(200);
            echo json_encode($customers);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }
}
