<?php

class AnalyticsController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * GET /api/admin/stats
     * Fetch statistical data for the admin dashboard.
     */
    public function stats() {
        // Assume authMiddleware() ran and populated $_REQUEST['user']
        if (!isset($_REQUEST['user']) || !isset($_REQUEST['user']['role']) || $_REQUEST['user']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            return;
        }

        try {
            $stats = [];

            // 1. Total Revenue and Total Orders (excluding cancelled)
            $stmt1 = $this->pdo->query("
                SELECT 
                    COALESCE(SUM(total), 0) as totalRevenue, 
                    COUNT(id) as totalOrders 
                FROM orders 
                WHERE status != 'cancelled'
            ");
            $revenueOrdersData = $stmt1->fetch(PDO::FETCH_ASSOC);
            $stats['totalRevenue'] = (float)$revenueOrdersData['totalRevenue'];
            $stats['totalOrders'] = (int)$revenueOrdersData['totalOrders'];

            // 2. Total Customers (excluding admins)
            $stmt2 = $this->pdo->query("
                SELECT COUNT(id) as totalCustomers 
                FROM users 
                WHERE is_admin = FALSE
            ");
            $stats['totalCustomers'] = (int)$stmt2->fetchColumn();

            // 2.1 Calculate Percentage Changes (Last 30 Days vs Previous 30 Days)
            $stmtChangeOrders = $this->pdo->query("
                SELECT 
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN total ELSE 0 END) as cur_rev,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN total ELSE 0 END) as prev_rev,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as cur_ord,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as prev_ord
                FROM orders WHERE status != 'cancelled'
            ");
            $changesOrders = $stmtChangeOrders->fetch(PDO::FETCH_ASSOC);
            
            $curRev = (float)$changesOrders['cur_rev'];
            $prevRev = (float)$changesOrders['prev_rev'];
            $stats['revenueChange'] = $prevRev > 0 ? round((($curRev - $prevRev) / $prevRev) * 100, 1) : ($curRev > 0 ? 100 : 0);

            $curOrd = (int)$changesOrders['cur_ord'];
            $prevOrd = (int)$changesOrders['prev_ord'];
            $stats['ordersChange'] = $prevOrd > 0 ? round((($curOrd - $prevOrd) / $prevOrd) * 100, 1) : ($curOrd > 0 ? 100 : 0);

            $stmtChangeCust = $this->pdo->query("
                SELECT 
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as cur_cust,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as prev_cust
                FROM users WHERE is_admin = FALSE
            ");
            $changesCust = $stmtChangeCust->fetch(PDO::FETCH_ASSOC);
            $curCust = (int)$changesCust['cur_cust'];
            $prevCust = (int)$changesCust['prev_cust'];
            $stats['customersChange'] = $prevCust > 0 ? round((($curCust - $prevCust) / $prevCust) * 100, 1) : ($curCust > 0 ? 100 : 0);


            // 2b. Total Products
            $stmtProd = $this->pdo->query("SELECT COUNT(id) FROM products");
            $stats['totalProducts'] = (int)$stmtProd->fetchColumn();

            // 2c. Pending Orders
            $stmtPend = $this->pdo->query("SELECT COUNT(id) FROM orders WHERE status = 'pending'");
            $stats['pendingOrders'] = (int)$stmtPend->fetchColumn();

            // 2d. Recent Orders
            $stmtRec = $this->pdo->query("
                SELECT o.*, COALESCE(u.email, o.shipping_email) as userEmail 
                FROM orders o 
                LEFT JOIN users u ON o.user_id = u.id 
                ORDER BY o.created_at DESC 
                LIMIT 5
            ");
            $stats['recentOrders'] = $stmtRec->fetchAll(PDO::FETCH_ASSOC);

            // 3. Weekly Revenue (last 12 weeks)
            $stmt3 = $this->pdo->query("
                SELECT 
                    YEARWEEK(created_at, 1) as week_identifier,
                    DATE(DATE_ADD(created_at, INTERVAL(1-DAYOFWEEK(created_at)) DAY)) as week_start,
                    COALESCE(SUM(total), 0) as revenue
                FROM orders
                WHERE status != 'cancelled' 
                  AND created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
                GROUP BY week_identifier, week_start
                ORDER BY week_identifier ASC
            ");
            $stats['weeklyRevenue'] = $stmt3->fetchAll(PDO::FETCH_ASSOC);

            // Fetch formatting
            foreach ($stats['weeklyRevenue'] as &$week) {
                $week['revenue'] = (float)$week['revenue'];
            }

            // 4. Category Revenue
            $stmt4 = $this->pdo->query("
                SELECT 
                    c.label as category, 
                    COALESCE(SUM(oi.quantity * oi.price), 0) as revenue 
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                JOIN categories c ON p.category_id = c.id
                WHERE o.status != 'cancelled'
                GROUP BY c.id
                ORDER BY revenue DESC
            ");
            $stats['categoryRevenue'] = $stmt4->fetchAll(PDO::FETCH_ASSOC);

            // Fetch formatting
            foreach ($stats['categoryRevenue'] as &$cat) {
                $cat['revenue'] = (float)$cat['revenue'];
            }

            // 5. Order Status Distribution
            $stmt5 = $this->pdo->query("
                SELECT status as name, COUNT(id) as count 
                FROM orders 
                GROUP BY status
            ");
            $statusCounts = $stmt5->fetchAll(PDO::FETCH_ASSOC);
            $totalStatus = array_sum(array_column($statusCounts, 'count'));
            $stats['statusData'] = [];
            $colors = [
                'delivered' => '#4ade80',
                'processing' => '#60a5fa',
                'shipped' => '#d4a59a',
                'pending' => '#facc15',
                'cancelled' => '#f87171'
            ];
            foreach ($statusCounts as $row) {
                $stats['statusData'][] = [
                    'name' => ucfirst($row['name']),
                    'value' => $totalStatus > 0 ? round(($row['count'] / $totalStatus) * 100) : 0,
                    'color' => $colors[$row['name']] ?? '#9a8f8c'
                ];
            }

            // 6. Top Products
            $stmt6 = $this->pdo->query("
                SELECT 
                    p.name, 
                    c.label as category,
                    SUM(oi.quantity) as sales,
                    SUM(oi.quantity * oi.price) as revenue
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                JOIN categories c ON p.category_id = c.id
                WHERE o.status != 'cancelled'
                GROUP BY p.id
                ORDER BY revenue DESC
                LIMIT 5
            ");
            $topProducts = $stmt6->fetchAll(PDO::FETCH_ASSOC);
            foreach ($topProducts as &$tp) {
                $tp['sales'] = (int)$tp['sales'];
                $tp['revenue'] = (float)$tp['revenue'];
            }
            $stats['topProducts'] = $topProducts;
            
            // 7. Low Stock Variants (Product > Color > Size)
            $stmtLow = $this->pdo->query("SELECT id, name, inventory, low_stock_threshold FROM products");
            $prods = $stmtLow->fetchAll(PDO::FETCH_ASSOC);
            $lowVariants = [];
            foreach ($prods as $p) {
                $inventory = json_decode($p['inventory'], true);
                if (empty($inventory) || !is_array($inventory)) continue;
                $threshold = (int)($p['low_stock_threshold'] ?? 5);
                
                foreach ($inventory as $inv) {
                    if (empty($inv['sizes']) || !is_array($inv['sizes'])) continue;
                    foreach ($inv['sizes'] as $s) {
                        $stock = (int)($s['stock'] ?? 0);
                        if ($stock <= $threshold) {
                            $lowVariants[] = [
                                'id' => $p['id'],
                                'name' => $p['name'],
                                'color' => $inv['color'],
                                'size' => $s['size'],
                                'stock' => $stock,
                                'threshold' => $threshold
                            ];
                        }
                    }
                }
            }
            $stats['lowStockVariants'] = array_slice($lowVariants, 0, 8); // Limit for dashboard
            $stats['lowStockTotalCount'] = count($lowVariants);

            http_response_code(200);
            echo json_encode($stats);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }
}
