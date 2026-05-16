<?php
require_once __DIR__ . "/../helpers/JwtHelper.php";

function authMiddleware() {
    $headers = getallheaders();
    $authHeader = isset($headers["Authorization"]) ? $headers["Authorization"] : (isset($headers["authorization"]) ? $headers["authorization"] : "");
    
    if (preg_match("/Bearer\s(\S+)/", $authHeader, $matches)) {
        $jwt = $matches[1];
        $decoded = JwtHelper::decode($jwt);
        
        if ($decoded) {
            // Fetch up-to-date role from the database to ensure correctness and prevent stale tokens
            if (isset($decoded['id'])) {
                require_once __DIR__ . "/../config/db.php";
                $db = new Database();
                $pdo = $db->getConnection();
                if ($pdo) {
                    $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
                    $stmt->execute([$decoded['id']]);
                    $dbUser = $stmt->fetch(\PDO::FETCH_ASSOC);
                    if ($dbUser) {
                        $decoded['role'] = (bool)$dbUser['is_admin'] ? 'admin' : 'customer';
                    }
                }
            }
            
            // Attach user details to the global request context
            $_REQUEST["user"] = $decoded;
            return true;
        }
    }
    
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized or invalid token"]);
    exit();
}

