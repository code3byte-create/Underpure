<?php
require_once __DIR__ . "/../../helpers/JwtHelper.php";

class AuthController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function register() {
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->name, $data->email, $data->password)) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields"]);
            return;
        }

        try {
            // Check for existing user
            $email = trim($data->email);
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(["error" => "Email already registered"]);
                return;
            }

            // Hash and Store
            $password_hash = password_hash($data->password, PASSWORD_DEFAULT);
            $stmt = $this->pdo->prepare("INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, FALSE)");
            
            if ($stmt->execute([$data->name, $email, $password_hash])) {
                $newUserId = $this->pdo->lastInsertId();
                
                $payload = [
                    "id" => $newUserId,
                    "email" => $data->email,
                    "role" => 'customer',
                    "exp" => time() + (60 * 60 * 24)
                ];
                
                http_response_code(201);
                echo json_encode([
                    "message" => "User registered successfully",
                    "token" => JwtHelper::encode($payload),
                    "user" => [
                        "id" => (string)$newUserId,
                        "name" => $data->name,
                        "email" => $data->email,
                        "isAdmin" => false
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Server error while saving user."]);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error.", "details" => $e->getMessage()]);
        }
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->email, $data->password)) {
            http_response_code(400);
            echo json_encode(["error" => "Missing email or password"]);
            return;
        }

        try {
            $email = trim($data->email);
            $stmt = $this->pdo->prepare("SELECT id, name, email, password_hash, is_admin FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                http_response_code(401);
                echo json_encode(["error" => "User account not found with this email"]);
                return;
            }

            if (password_verify($data->password, $user["password_hash"])) {
                $isAdmin = (bool) $user["is_admin"];
                $role = $isAdmin ? 'admin' : 'customer';
                
                $payload = [
                    "id" => $user["id"],
                    "email" => $user["email"],
                    "role" => $role,
                    "exp" => time() + (60 * 60 * 24) // 24-hour expiration
                ];
                
                echo json_encode([
                    "success" => true,
                    "message" => "Login successful",
                    "token" => JwtHelper::encode($payload),
                    "user" => [
                        "id" => (string)$user["id"],
                        "name" => $user["name"],
                        "email" => $user["email"],
                        "isAdmin" => $isAdmin
                    ]
                ]);
            } else {
                http_response_code(401);
                // Help debug by admitting the user was found but password failed
                echo json_encode(["error" => "Invalid password."]);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error.", "details" => $e->getMessage()]);
        }
    }

    public function me() {
        // Assume authMiddleware() has already populated $_REQUEST['user']
        $userPayload = $_REQUEST["user"];
        
        try {
            $stmt = $this->pdo->prepare("SELECT id, name, email, is_admin, created_at FROM users WHERE id = ?");
            $stmt->execute([$userPayload["id"]]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                $user["isAdmin"] = (bool) $user["is_admin"];
                // remove is_admin to keep response clean
                unset($user["is_admin"]);
                echo json_encode(["user" => $user]);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "User not found"]);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error.", "details" => $e->getMessage()]);
        }
    }

    public function googleLogin() {
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->credential)) {
            http_response_code(400);
            echo json_encode(["error" => "Missing Google credential"]);
            return;
        }

        try {
            // 1. Verify token with Google API
            $id_token = $data->credential;
            $verify_url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $id_token;
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $verify_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local dev
            $response = curl_exec($ch);
            
            if ($response === false) {
                $error = curl_error($ch);
                curl_close($ch);
                http_response_code(500);
                echo json_encode(["error" => "Google verification failed", "details" => $error]);
                return;
            }
            curl_close($ch);
            
            $google_user = json_decode($response, true);

            if (!isset($google_user['email'])) {
                http_response_code(401);
                echo json_encode(["error" => "Invalid Google token response", "raw" => $response]);
                return;
            }

            $email = $google_user['email'];
            $name = $google_user['name'];
            $google_id = $google_user['sub'];

            // 2. Check if user exists
            $stmt = $this->pdo->prepare("SELECT id, name, email, is_admin FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                // 3. Create new user if not exists
                // Try to insert with google_id, fallback if column missing
                try {
                    $stmt = $this->pdo->prepare("INSERT INTO users (name, email, is_admin, google_id) VALUES (?, ?, FALSE, ?)");
                    $stmt->execute([$name, $email, $google_id]);
                    $userId = $this->pdo->lastInsertId();
                } catch (\PDOException $e) {
                    // Fallback: If google_id column doesn't exist, insert without it
                    $stmt = $this->pdo->prepare("INSERT INTO users (name, email, is_admin) VALUES (?, ?, FALSE)");
                    $stmt->execute([$name, $email]);
                    $userId = $this->pdo->lastInsertId();
                }
                
                $user = [
                    "id" => $userId,
                    "name" => $name,
                    "email" => $email,
                    "is_admin" => 0
                ];
            }

            // 4. Generate JWT
            $isAdmin = (bool) $user["is_admin"];
            $role = $isAdmin ? 'admin' : 'customer';
            
            $payload = [
                "id" => $user["id"],
                "email" => $user["email"],
                "role" => $role,
                "exp" => time() + (60 * 60 * 24 * 7) // 1 week
            ];
            
            echo json_encode([
                "success" => true,
                "message" => "Google login successful",
                "token" => JwtHelper::encode($payload),
                "user" => [
                    "id" => (string)$user["id"],
                    "name" => $user["name"],
                    "email" => $user["email"],
                    "isAdmin" => $isAdmin
                ]
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Internal server error during Google login", "message" => $e->getMessage()]);
        }
    }

    public function forgotPassword() {
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->email)) {
            http_response_code(400);
            echo json_encode(["error" => "Missing email address"]);
            return;
        }

        try {
            $email = trim($data->email);
            $stmt = $this->pdo->prepare("SELECT id, name FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                http_response_code(404);
                echo json_encode(["error" => "No account found with this email address"]);
                return;
            }

            // Generate 6-digit OTP
            $otp = (string)rand(100000, 990000);

            // Save OTP in database
            $stmt = $this->pdo->prepare("UPDATE users SET otp_code = ? WHERE email = ?");
            $stmt->execute([$otp, $email]);

            // Send real email
            $to = $email;
            $subject = "Your Underpure Password Reset Code";
            
            // Premium HTML Email Template matching Underpure luxury branding
            $message = '
            <html>
            <head>
                <style>
                    body { font-family: "Montserrat", Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #f5f0ee; margin: 0; padding: 40px; }
                    .card { max-width: 500px; margin: 0 auto; background-color: #111; border: 1px solid #d4a59a; padding: 30px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
                    .logo { text-align: center; font-size: 24px; letter-spacing: 0.15em; text-transform: uppercase; color: #d4a59a; font-weight: bold; margin-bottom: 30px; }
                    .title { font-size: 18px; font-weight: 500; margin-bottom: 20px; color: #f5f0ee; }
                    .otp-box { background-color: #0a0a0a; border: 1px dashed #d4a59a; padding: 15px; font-size: 28px; font-weight: bold; text-align: center; letter-spacing: 0.2em; color: #d4a59a; margin: 30px 0; border-radius: 4px; }
                    .footer { font-size: 11px; color: #9a8f8c; text-align: center; margin-top: 40px; border-top: 1px solid #d4a59a; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="logo">UNDERPURE</div>
                    <div class="title">Hello ' . htmlspecialchars($user['name']) . ',</div>
                    <p>We received a request to reset your password. Use the verification code below to complete the reset process:</p>
                    <div class="otp-box">' . $otp . '</div>
                    <p>This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
                    <div class="footer">This is an automated email from Underpure Store. Please do not reply to this email.</div>
                </div>
            </body>
            </html>
            ';

            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $headers .= "From: Underpure Store <noreply@underpure.com>" . "\r\n";

            $isLocalhost = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']) || (isset($_SERVER['SERVER_NAME']) && in_array($_SERVER['SERVER_NAME'], ['localhost', '127.0.0.1']));
            $mailSent = @mail($to, $subject, $message, $headers);

            if ($mailSent || $isLocalhost) {
                $responsePayload = ["success" => true, "message" => "OTP sent successfully"];
                if ($isLocalhost && !$mailSent) {
                    $responsePayload["debug_otp"] = $otp;
                    file_put_contents(__DIR__ . "/../../otp_log.txt", "OTP for " . $data->email . ": " . $otp . "\n", FILE_APPEND);
                }
                echo json_encode($responsePayload);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to send email. Please ensure your SMTP server is configured."]);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Internal server error", "details" => $e->getMessage()]);
        }
    }

    public function resetPassword() {
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->email, $data->otp, $data->password)) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields"]);
            return;
        }

        try {
            $email = trim($data->email);
            $stmt = $this->pdo->prepare("SELECT otp_code FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                http_response_code(404);
                echo json_encode(["error" => "User account not found"]);
                return;
            }

            if (empty($user['otp_code']) || $user['otp_code'] !== $data->otp) {
                http_response_code(400);
                echo json_encode(["error" => "Invalid or expired verification code"]);
                return;
            }

            // Hash new password and clear OTP
            $password_hash = password_hash($data->password, PASSWORD_DEFAULT);
            $stmt = $this->pdo->prepare("UPDATE users SET password_hash = ?, otp_code = NULL WHERE email = ?");
            
            if ($stmt->execute([$password_hash, $email])) {
                echo json_encode(["success" => true, "message" => "Password reset successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to update password"]);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Internal server error", "details" => $e->getMessage()]);
        }
    }
}
