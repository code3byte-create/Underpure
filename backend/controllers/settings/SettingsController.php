<?php

class SettingsController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * GET /settings
     * Fetch all site settings and format as a key-value object.
     */
    public function index() {
        try {
            $stmt = $this->pdo->query("SELECT setting_key, setting_value FROM site_settings");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $settings = [];
            foreach ($rows as $row) {
                $val = $row['setting_value'];
                
                // Attempt to parse JSON values (arrays, objects stored as JSON strings)
                $decoded = json_decode($val, true);
                if (json_last_error() === JSON_ERROR_NONE && !is_numeric($val) && !is_bool($val)) {
                    $settings[$row['setting_key']] = $decoded;
                } else {
                    // Convert string booleans back to actual booleans
                    if ($val === 'true') $val = true;
                    if ($val === 'false') $val = false;
                    $settings[$row['setting_key']] = $val;
                }
            }

            http_response_code(200);
            echo json_encode($settings);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }

    /**
     * PUT /settings
     * Update or insert site settings. Requires Admin access.
     */
    public function update() {
        // ---- Auth Check ----
        if (!isset($_REQUEST['user']) || $_REQUEST['user']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden. Admin access required.']);
            return;
        }

        // ---- Read & Validate JSON Payload ----
        $rawBody = file_get_contents("php://input");

        if (empty($rawBody)) {
            http_response_code(400);
            echo json_encode([
                'error'   => 'Empty request body. Expected a JSON object with key-value pairs.',
                'rawBody' => ''
            ]);
            return;
        }

        $data = json_decode($rawBody, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode([
                'error'          => 'Invalid JSON payload.',
                'json_error'     => json_last_error_msg(),
                'raw_body_start' => substr($rawBody, 0, 200) // First 200 chars for debugging
            ]);
            return;
        }

        if (!is_array($data) || count($data) === 0) {
            http_response_code(400);
            echo json_encode([
                'error' => 'JSON decoded successfully but result is not a non-empty object/array.',
                'type'  => gettype($data)
            ]);
            return;
        }

        // ---- Upsert each setting into DB ----
        try {
            $this->pdo->beginTransaction();

            $sql = "INSERT INTO site_settings (setting_key, setting_value) 
                    VALUES (:skey, :sval) 
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)";
            
            $stmt = $this->pdo->prepare($sql);

            foreach ($data as $key => $value) {
                // Flatten arrays/objects to JSON strings for storage
                if (is_array($value) || is_object($value)) {
                    $value = json_encode($value);
                } elseif (is_bool($value)) {
                    $value = $value ? 'true' : 'false';
                } else {
                    $value = (string) $value;
                }

                $stmt->execute([':skey' => $key, ':sval' => $value]);
            }

            $this->pdo->commit();

            http_response_code(200);
            echo json_encode([
                'message'      => 'Settings updated successfully.',
                'keys_updated' => array_keys($data)
            ]);

        } catch (\PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode([
                'error' => 'Database error', 
                'details' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        }
    }
}
