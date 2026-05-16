<?php
class JwtHelper {
    // In production, load this from an environment variable or config file
    private static $secret = "YOUR_SUPER_SECRET_KEY";

    public static function encode($payload) {
        $header = json_encode(["typ" => "JWT", "alg" => "HS256"]);
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac("sha256", $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($jwt) {
        $parts = explode(".", $jwt);
        if (count($parts) !== 3) return null;
        
        list($header64, $payload64, $sign64) = $parts;
        
        $signature = self::base64UrlEncode(hash_hmac("sha256", $header64 . "." . $payload64, self::$secret, true));
        if (!hash_equals($signature, $sign64)) return null; // Signature mismatch
        
        $payload = json_decode(self::base64UrlDecode($payload64), true);
        
        if (isset($payload["exp"]) && $payload["exp"] < time()) {
            return null; // Token expired
        }
        
        return $payload;
    }

    private static function base64UrlEncode($data) {
        return str_replace(["+", "/", "="], ["-", "_", ""], base64_encode($data));
    }

    private static function base64UrlDecode($data) {
        $b64 = str_replace(["-", "_"], ["+", "/"], $data);
        while (strlen($b64) % 4 !== 0) $b64 .= "=";
        return base64_decode($b64);
    }
}

