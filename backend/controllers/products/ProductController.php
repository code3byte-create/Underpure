<?php

class ProductController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * GET /api/products
     * Fetch all products with their images, supporting filters and sorting.
     */
    public function index() {
        $params = [];
        $whereClauses = ["1=1"];

        // Filter by Category (including subcategories)
        if (!empty($_GET['category'])) {
            $whereClauses[] = "(c.slug = ? OR c.parent_id IN (SELECT id FROM categories WHERE slug = ?))";
            $params[] = $_GET['category'];
            $params[] = $_GET['category'];
        }

        // Filter by Search (Name or Description)
        if (!empty($_GET['search'])) {
            $whereClauses[] = "(p.name LIKE ? OR p.description LIKE ?)";
            $searchTerm = '%' . $_GET['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereSql = implode(' AND ', $whereClauses);

        // Sorting
        $orderBy = "p.created_at DESC";
        if (!empty($_GET['sort'])) {
            switch ($_GET['sort']) {
                case 'price_asc':
                    $orderBy = "p.price ASC";
                    break;
                case 'price_desc':
                    $orderBy = "p.price DESC";
                    break;
                case 'newest':
                    $orderBy = "p.created_at DESC";
                    break;
            }
        }

        // Limit & Pagination
        $limitSql = "";
        if (!empty($_GET['limit']) && is_numeric($_GET['limit'])) {
            $limit = (int)$_GET['limit'];
            if ($limit > 0 && $limit <= 1000) { // Max limit to prevent abuse
                $limitSql = " LIMIT " . $limit;
                if (isset($_GET['offset']) && is_numeric($_GET['offset'])) {
                    $offset = (int)$_GET['offset'];
                    if ($offset >= 0) {
                        $limitSql .= " OFFSET " . $offset;
                    }
                }
            }
        }

        // Base Query joining categories
        $sql = "SELECT 
                    p.id, p.slug, p.name, p.description, p.long_description as longDescription, 
                    p.price, p.original_price as originalPrice, p.stock_count as stockCount, p.low_stock_threshold as lowStockThreshold, p.category_id, p.badge, p.created_at,
                    p.sizes, p.colors, p.inventory, p.featured,
                    c.label as category_label, c.slug as category
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE $whereSql
                ORDER BY $orderBy
                $limitSql";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch images for the retrieved products
        if (count($products) > 0) {
            $productIds = array_column($products, 'id');
            $placeholders = implode(',', array_fill(0, count($productIds), '?'));
            
            $imgSql = "SELECT id, product_id, image_url, color, is_primary FROM product_images WHERE product_id IN ($placeholders)";
            $imgStmt = $this->pdo->prepare($imgSql);
            $imgStmt->execute($productIds);
            $images = $imgStmt->fetchAll(PDO::FETCH_ASSOC);

            // Group images by product_id
            $imagesByProduct = [];
            foreach ($images as $img) {
                $imagesByProduct[$img['product_id']][] = $img;
            }

            // Attach images to products and decode json
            foreach ($products as &$product) {
                $rawImages = $imagesByProduct[$product['id']] ?? [];
                
                $product['image'] = null;
                $mappedImages = [];
                foreach ($rawImages as $img) {
                    $mappedImages[] = $img['image_url'];
                    if ($img['is_primary']) {
                        $product['image'] = $img['image_url'];
                    }
                }
                $product['images'] = $mappedImages;
                if (empty($product['image']) && !empty($product['images'])) {
                    $product['image'] = $product['images'][0];
                }

                $product['sizes'] = !empty($product['sizes']) ? json_decode($product['sizes'], true) : [];
                $product['colors'] = !empty($product['colors']) ? json_decode($product['colors'], true) : [];
                $product['inventory'] = !empty($product['inventory']) ? json_decode($product['inventory'], true) : [];
                $product['featured'] = (bool)$product['featured'];
                $product['lowStockThreshold'] = isset($product['lowStockThreshold']) ? (int)$product['lowStockThreshold'] : 5;
                $product['inStock'] = $product['stockCount'] === null || $product['stockCount'] > 0;
            }
        }

        http_response_code(200);
        echo json_encode(['products' => $products]);
    }

    /**
     * GET /api/products/:slug
     */
    public function show($slugOrId) {
        $sql = "SELECT 
                    p.id, p.slug, p.name, p.description, p.long_description as longDescription, 
                    p.price, p.original_price as originalPrice, p.stock_count as stockCount, p.low_stock_threshold as lowStockThreshold, p.category_id, p.badge, p.created_at,
                    p.sizes, p.colors, p.inventory, p.featured,
                    c.label as category_label, c.slug as category
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.slug = ? OR p.id = ?";
                
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$slugOrId, $slugOrId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
            return;
        }

        $imgSql = "SELECT image_url, color, is_primary FROM product_images WHERE product_id = ?";
        $imgStmt = $this->pdo->prepare($imgSql);
        $imgStmt->execute([$product['id']]);
        $rawImages = $imgStmt->fetchAll(PDO::FETCH_ASSOC);

        $product['image'] = null;
        $mappedImages = [];
        $colorImages = [];

        foreach ($rawImages as $img) {
            $mappedImages[] = $img['image_url'];
            if ($img['is_primary']) {
                $product['image'] = $img['image_url'];
            }
            if (!empty($img['color'])) {
                $colorImages[$img['color']][] = $img['image_url'];
            }
        }

        $product['images'] = $mappedImages;
        if (empty($product['image']) && !empty($product['images'])) {
            $product['image'] = $product['images'][0];
        }

        $product['sizes'] = !empty($product['sizes']) ? json_decode($product['sizes'], true) : [];
        $product['colors'] = !empty($product['colors']) ? json_decode($product['colors'], true) : [];
        $product['inventory'] = !empty($product['inventory']) ? json_decode($product['inventory'], true) : [];
        $product['featured'] = (bool)$product['featured'];
        $product['colorImages'] = $colorImages;
        $product['inStock'] = $product['stockCount'] === null || $product['stockCount'] > 0;

        http_response_code(200);
        echo json_encode(['product' => $product]);
    }

    /**
     * POST /api/products
     * Admin protected endpoint to create a new product and upload images to Cloudinary.
     */
    public function create() {
        $isAdmin = false;
        if (isset($_REQUEST['user'])) {
            if (isset($_REQUEST['user']['role']) && $_REQUEST['user']['role'] === 'admin') {
                $isAdmin = true;
            } elseif (isset($_REQUEST['user']['id'])) {
                $stmt = $this->pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
                $stmt->execute([$_REQUEST['user']['id']]);
                $dbUser = $stmt->fetch(\PDO::FETCH_ASSOC);
                if ($dbUser && (bool)$dbUser['is_admin']) {
                    $isAdmin = true;
                }
            }
        }

        if (!$isAdmin) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            $data = $_POST;
        }

        if (empty($data['name']) || empty($data['slug']) || !isset($data['price'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: name, slug, price']);
            return;
        }

        require_once __DIR__ . '/../../helpers/CloudinaryHelper.php';

        try {
            $this->pdo->beginTransaction();

            $categoryId = null;
            if (!empty($data['category'])) {
                $stmt = $this->pdo->prepare("SELECT id FROM categories WHERE slug = ? OR id = ?");
                $stmt->execute([$data['category'], $data['category']]);
                $catRow = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($catRow) {
                    $categoryId = $catRow['id'];
                }
            }

            // Ensure unique slug for create
            $originalSlug = rtrim($data['slug'], '-');
            $slug = $originalSlug;
            $slugSuffix = 1;
            while (true) {
                $checkStmt = $this->pdo->prepare("SELECT COUNT(*) FROM products WHERE slug = ?");
                $checkStmt->execute([$slug]);
                if ($checkStmt->fetchColumn() == 0) {
                    break;
                }
                $slug = $originalSlug . '-' . $slugSuffix;
                $slugSuffix++;
            }
            $data['slug'] = $slug;

            $imagesToUpload = [];
            $imagePointers = [];

            if (!empty($data['inventory'])) {
                foreach ($data['inventory'] as $invIdx => $invItem) {
                    if (!empty($invItem['images'])) {
                        foreach ($invItem['images'] as $iIdx => $imgData) {
                            if (strpos($imgData, 'data:image') === 0) {
                                $imagesToUpload[] = $imgData;
                                $imagePointers[] = ['type' => 'inventory', 'invIdx' => $invIdx, 'iIdx' => $iIdx];
                            }
                        }
                    }
                }
            }

            if (!empty($data['colors'])) {
                foreach ($data['colors'] as $cIdx => $colorObj) {
                    if (!empty($colorObj['images'])) {
                        foreach ($colorObj['images'] as $iIdx => $imgData) {
                            if (strpos($imgData, 'data:image') === 0) {
                                $imagesToUpload[] = $imgData;
                                $imagePointers[] = ['type' => 'color', 'cIdx' => $cIdx, 'iIdx' => $iIdx];
                            }
                        }
                    }
                }
            }

            if (!empty($data['image']) && strpos($data['image'], 'data:image') === 0) {
                $imagesToUpload[] = $data['image'];
                $imagePointers[] = ['type' => 'primary'];
            }

            if (!empty($imagesToUpload)) {
                $uploadedUrls = CloudinaryHelper::uploadImagesBatchBase64($imagesToUpload);
                foreach ($imagePointers as $k => $ptr) {
                    $url = $uploadedUrls[$k];
                    if ($url) {
                        if ($ptr['type'] === 'color') {
                            $data['colors'][$ptr['cIdx']]['images'][$ptr['iIdx']] = $url;
                        } elseif ($ptr['type'] === 'inventory') {
                            $data['inventory'][$ptr['invIdx']]['images'][$ptr['iIdx']] = $url;
                        } elseif ($ptr['type'] === 'primary') {
                            $data['image'] = $url;
                        }
                    }
                }
            }

            if (!empty($data['colors'])) {
                foreach ($data['colors'] as $k => $colorObj) {
                    if (!empty($colorObj['images'])) {
                        $cleanUrls = [];
                        foreach ($colorObj['images'] as $imgData) {
                            if (strpos($imgData, 'data:image') !== 0) {
                                $cleanUrls[] = $imgData;
                            }
                        }
                        $data['colors'][$k]['images'] = $cleanUrls;
                    }
                }
            }

            if (!empty($data['inventory'])) {
                foreach ($data['inventory'] as $k => $invItem) {
                    if (!empty($invItem['images'])) {
                        $cleanUrls = [];
                        foreach ($invItem['images'] as $imgData) {
                            if (strpos($imgData, 'data:image') !== 0) {
                                $cleanUrls[] = $imgData;
                            }
                        }
                        $data['inventory'][$k]['images'] = $cleanUrls;
                    }
                }
            }

            if (!empty($data['image']) && strpos($data['image'], 'data:image') === 0) {
                $data['image'] = null;
            }

            $stockCount = 0;
            if (!empty($data['inventory']) && is_array($data['inventory'])) {
                foreach ($data['inventory'] as $invItem) {
                    if (!empty($invItem['sizes']) && is_array($invItem['sizes'])) {
                        foreach ($invItem['sizes'] as $sizeObj) {
                            $stockCount += isset($sizeObj['stock']) ? (int)$sizeObj['stock'] : 0;
                        }
                    }
                }
            } else {
                $stockCount = isset($data['stockCount']) ? (int)$data['stockCount'] : 0;
            }

            $sql = "INSERT INTO products (slug, name, description, long_description, price, original_price, stock_count, low_stock_threshold, category_id, badge, sizes, colors, inventory, featured) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['slug'],
                $data['name'],
                $data['description'] ?? null,
                $data['longDescription'] ?? null,
                $data['price'],
                $data['originalPrice'] ?? null,
                $stockCount,
                $data['lowStockThreshold'] ?? 5,
                $categoryId,
                $data['badge'] ?? null,
                isset($data['sizes']) ? json_encode($data['sizes']) : null,
                isset($data['colors']) ? json_encode($data['colors']) : null,
                isset($data['inventory']) ? json_encode($data['inventory']) : null,
                $data['featured'] ?? 0
            ]);

            $productId = $this->pdo->lastInsertId();

            if (!empty($data['image'])) {
                $this->pdo->prepare("INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)")
                          ->execute([$productId, $data['image']]);
            }

            if (!empty($data['colors'])) {
                foreach ($data['colors'] as $colorObj) {
                    if (!empty($colorObj['images'])) {
                        foreach ($colorObj['images'] as $url) {
                            $this->pdo->prepare("INSERT INTO product_images (product_id, image_url, color, is_primary) VALUES (?, ?, ?, 0)")
                                      ->execute([$productId, $url, $colorObj['name']]);
                        }
                    }
                }
            }

            $this->pdo->commit();
            http_response_code(201);
            echo json_encode(['message' => 'Product created successfully', 'product_id' => $productId]);
        } catch (\Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("Failed to create product: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to create product',
                'details' => $e->getMessage(),
                'received_data' => $data
            ]);
        }
    }

    public function update($id) {
        $isAdmin = false;
        if (isset($_REQUEST['user'])) {
            if (isset($_REQUEST['user']['role']) && $_REQUEST['user']['role'] === 'admin') {
                $isAdmin = true;
            } elseif (isset($_REQUEST['user']['id'])) {
                $stmt = $this->pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
                $stmt->execute([$_REQUEST['user']['id']]);
                $dbUser = $stmt->fetch(\PDO::FETCH_ASSOC);
                if ($dbUser && (bool)$dbUser['is_admin']) {
                    $isAdmin = true;
                }
            }
        }

        if (!$isAdmin) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            $data = $_POST;
        }

        if (empty($data['name']) || empty($data['slug']) || !isset($data['price'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: name, slug, price']);
            return;
        }

        require_once __DIR__ . '/../../helpers/CloudinaryHelper.php';

        try {
            $this->pdo->beginTransaction();

            $categoryId = null;
            if (!empty($data['category'])) {
                $stmt = $this->pdo->prepare("SELECT id FROM categories WHERE slug = ? OR id = ?");
                $stmt->execute([$data['category'], $data['category']]);
                $catRow = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($catRow) {
                    $categoryId = $catRow['id'];
                }
            }

            // Ensure unique slug for update (excluding current product)
            $originalSlug = rtrim($data['slug'], '-');
            $slug = $originalSlug;
            $slugSuffix = 1;
            while (true) {
                $checkStmt = $this->pdo->prepare("SELECT COUNT(*) FROM products WHERE slug = ? AND id != ?");
                $checkStmt->execute([$slug, $id]);
                if ($checkStmt->fetchColumn() == 0) {
                    break;
                }
                $slug = $originalSlug . '-' . $slugSuffix;
                $slugSuffix++;
            }
            $data['slug'] = $slug;

            $imagesToUpload = [];
            $imagePointers = [];

            if (!empty($data['inventory'])) {
                foreach ($data['inventory'] as $invIdx => $invItem) {
                    if (!empty($invItem['images'])) {
                        foreach ($invItem['images'] as $iIdx => $imgData) {
                            if (strpos($imgData, 'data:image') === 0) {
                                $imagesToUpload[] = $imgData;
                                $imagePointers[] = ['type' => 'inventory', 'invIdx' => $invIdx, 'iIdx' => $iIdx];
                            }
                        }
                    }
                }
            }

            if (!empty($data['colors'])) {
                foreach ($data['colors'] as $cIdx => $colorObj) {
                    if (!empty($colorObj['images'])) {
                        foreach ($colorObj['images'] as $iIdx => $imgData) {
                            if (strpos($imgData, 'data:image') === 0) {
                                $imagesToUpload[] = $imgData;
                                $imagePointers[] = ['type' => 'color', 'cIdx' => $cIdx, 'iIdx' => $iIdx];
                            }
                        }
                    }
                }
            }

            if (!empty($data['image']) && strpos($data['image'], 'data:image') === 0) {
                $imagesToUpload[] = $data['image'];
                $imagePointers[] = ['type' => 'primary'];
            }

            if (!empty($imagesToUpload)) {
                $uploadedUrls = CloudinaryHelper::uploadImagesBatchBase64($imagesToUpload);
                foreach ($imagePointers as $k => $ptr) {
                    $url = $uploadedUrls[$k];
                    if ($url) {
                        if ($ptr['type'] === 'color') {
                            $data['colors'][$ptr['cIdx']]['images'][$ptr['iIdx']] = $url;
                        } elseif ($ptr['type'] === 'inventory') {
                            $data['inventory'][$ptr['invIdx']]['images'][$ptr['iIdx']] = $url;
                        } elseif ($ptr['type'] === 'primary') {
                            $data['image'] = $url;
                        }
                    }
                }
            }

            if (!empty($data['colors'])) {
                foreach ($data['colors'] as $k => $colorObj) {
                    if (!empty($colorObj['images'])) {
                        $cleanUrls = [];
                        foreach ($colorObj['images'] as $imgData) {
                            if (strpos($imgData, 'data:image') !== 0) {
                                $cleanUrls[] = $imgData;
                            }
                        }
                        $data['colors'][$k]['images'] = $cleanUrls;
                    }
                }
            }

            if (!empty($data['inventory'])) {
                foreach ($data['inventory'] as $k => $invItem) {
                    if (!empty($invItem['images'])) {
                        $cleanUrls = [];
                        foreach ($invItem['images'] as $imgData) {
                            if (strpos($imgData, 'data:image') !== 0) {
                                $cleanUrls[] = $imgData;
                            }
                        }
                        $data['inventory'][$k]['images'] = $cleanUrls;
                    }
                }
            }

            if (!empty($data['image']) && strpos($data['image'], 'data:image') === 0) {
                $data['image'] = null;
            }

            $stockCount = 0;
            if (!empty($data['inventory']) && is_array($data['inventory'])) {
                foreach ($data['inventory'] as $invItem) {
                    if (!empty($invItem['sizes']) && is_array($invItem['sizes'])) {
                        foreach ($invItem['sizes'] as $sizeObj) {
                            $stockCount += isset($sizeObj['stock']) ? (int)$sizeObj['stock'] : 0;
                        }
                    }
                }
            } else {
                $stockCount = isset($data['stockCount']) ? (int)$data['stockCount'] : 0;
            }

            $sql = "UPDATE products SET slug = ?, name = ?, description = ?, long_description = ?, price = ?, original_price = ?, stock_count = ?, low_stock_threshold = ?, category_id = ?, badge = ?, sizes = ?, colors = ?, inventory = ?, featured = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['slug'],
                $data['name'],
                $data['description'] ?? null,
                $data['longDescription'] ?? null,
                $data['price'],
                $data['originalPrice'] ?? null,
                $stockCount,
                $data['lowStockThreshold'] ?? 5,
                $categoryId,
                $data['badge'] ?? null,
                isset($data['sizes']) ? json_encode($data['sizes']) : null,
                isset($data['colors']) ? json_encode($data['colors']) : null,
                isset($data['inventory']) ? json_encode($data['inventory']) : null,
                $data['featured'] ?? 0,
                $id
            ]);

            $this->pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$id]);

            if (!empty($data['image'])) {
                $this->pdo->prepare("INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)")
                          ->execute([$id, $data['image']]);
            }

            if (!empty($data['colors'])) {
                foreach ($data['colors'] as $colorObj) {
                    if (!empty($colorObj['images'])) {
                        foreach ($colorObj['images'] as $url) {
                            $this->pdo->prepare("INSERT INTO product_images (product_id, image_url, color, is_primary) VALUES (?, ?, ?, 0)")
                                      ->execute([$id, $url, $colorObj['name']]);
                        }
                    }
                }
            }

            $this->pdo->commit();
            http_response_code(200);
            echo json_encode(['message' => 'Product updated successfully', 'product_id' => $id]);
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            error_log("Failed to update product: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update product', 'details' => $e->getMessage()]);
        }
    }

    public function delete($id) {
        $isAdmin = false;
        if (isset($_REQUEST['user'])) {
            if (isset($_REQUEST['user']['role']) && $_REQUEST['user']['role'] === 'admin') {
                $isAdmin = true;
            } elseif (isset($_REQUEST['user']['id'])) {
                $stmt = $this->pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
                $stmt->execute([$_REQUEST['user']['id']]);
                $dbUser = $stmt->fetch(\PDO::FETCH_ASSOC);
                if ($dbUser && (bool)$dbUser['is_admin']) {
                    $isAdmin = true;
                }
            }
        }

        if (!$isAdmin) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            return;
        }

        try {
            $this->pdo->beginTransaction();

            // 1. Fetch images to delete from Cloudinary
            $stmt = $this->pdo->prepare("SELECT image_url FROM product_images WHERE product_id = ?");
            $stmt->execute([$id]);
            $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 2. Delete product from database (cascade deletes product_images due to foreign key)
            $stmt = $this->pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);

            $this->pdo->commit();

            // 3. Delete images from Cloudinary securely via backend
            require_once __DIR__ . '/../../helpers/CloudinaryHelper.php';
            foreach ($images as $img) {
                if (!empty($img['image_url'])) {
                    CloudinaryHelper::deleteImage($img['image_url']);
                }
            }

            http_response_code(200);
            echo json_encode(['message' => 'Product and associated images deleted successfully']);
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete product']);
        }
    }
}
