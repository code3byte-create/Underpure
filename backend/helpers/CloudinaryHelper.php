<?php
require_once __DIR__ . '/../config/cloudinary.php';

class CloudinaryHelper {
    
    /**
     * Extracts public_id from a Cloudinary URL
     * Example URL: https://res.cloudinary.com/dcdogxx8v/image/upload/v1714574989/underpure_preset/image_abc.jpg
     */
    public static function extractPublicId($url) {
        if (!$url || strpos($url, 'cloudinary.com') === false) {
            return false;
        }

        $parts = explode('/upload/', $url);
        if (count($parts) < 2) {
            return false;
        }

        $path = $parts[1];
        $pathParts = explode('/', $path);
        
        // Remove version string (e.g. v123456789) if present
        if (preg_match('/^v\d+$/', $pathParts[0])) {
            array_shift($pathParts);
        }
        
        $pathWithoutVersion = implode('/', $pathParts);
        
        // Remove file extension
        $publicId = preg_replace('/\.[^.]+$/', '', $pathWithoutVersion);
        
        return $publicId;
    }

    /**
     * Uploads a base64 encoded image to Cloudinary
     */
    public static function uploadImageBase64($base64String, $folder = 'products') {
        if (CLOUDINARY_API_KEY === 'YOUR_API_KEY_HERE' || CLOUDINARY_API_SECRET === 'YOUR_API_SECRET_HERE') {
            error_log("Cloudinary API credentials not configured. Cannot upload image.");
            return false;
        }

        $url = "https://api.cloudinary.com/v1_1/" . CLOUDINARY_CLOUD_NAME . "/image/upload";
        
        $timestamp = time();
        $stringToSign = "folder=" . $folder . "&timestamp=" . $timestamp . CLOUDINARY_API_SECRET;
        $signature = sha1($stringToSign);

        $postFields = [
            'file' => $base64String,
            'api_key' => CLOUDINARY_API_KEY,
            'timestamp' => $timestamp,
            'signature' => $signature,
            'folder' => $folder
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true);
        
        if ($httpCode == 200 && isset($result['secure_url'])) {
            return $result['secure_url'];
        }
        
        error_log("Cloudinary upload failed: " . $response);
        return false;
    }

    /**
     * Uploads multiple base64 encoded images to Cloudinary concurrently
     */
    public static function uploadImagesBatchBase64($base64Strings, $folder = 'products') {
        if (empty($base64Strings)) return [];
        
        if (CLOUDINARY_API_KEY === 'YOUR_API_KEY_HERE' || CLOUDINARY_API_SECRET === 'YOUR_API_SECRET_HERE') {
            error_log("Cloudinary API credentials not configured. Cannot upload images.");
            return array_fill(0, count($base64Strings), false);
        }

        $url = "https://api.cloudinary.com/v1_1/" . CLOUDINARY_CLOUD_NAME . "/image/upload";
        
        $multiHandle = curl_multi_init();
        $curlHandles = [];
        $results = array_fill(0, count($base64Strings), false);

        $timestamp = time();
        $stringToSign = "folder=" . $folder . "&timestamp=" . $timestamp . CLOUDINARY_API_SECRET;
        $signature = sha1($stringToSign);

        foreach ($base64Strings as $i => $base64String) {
            $postFields = [
                'file' => $base64String,
                'api_key' => CLOUDINARY_API_KEY,
                'timestamp' => $timestamp,
                'signature' => $signature,
                'folder' => $folder
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $curlHandles[$i] = $ch;
            curl_multi_add_handle($multiHandle, $ch);
        }

        $active = null;
        do {
            $mrc = curl_multi_exec($multiHandle, $active);
        } while ($mrc == CURLM_CALL_MULTI_PERFORM);

        while ($active && $mrc == CURLM_OK) {
            if (curl_multi_select($multiHandle) != -1) {
                do {
                    $mrc = curl_multi_exec($multiHandle, $active);
                } while ($mrc == CURLM_CALL_MULTI_PERFORM);
            }
        }

        foreach ($curlHandles as $i => $ch) {
            $response = curl_multi_getcontent($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            
            if ($httpCode == 200) {
                $result = json_decode($response, true);
                if (isset($result['secure_url'])) {
                    $results[$i] = $result['secure_url'];
                }
            } else {
                error_log("Cloudinary batch upload failed for index $i: " . $response);
            }
            
            curl_multi_remove_handle($multiHandle, $ch);
            curl_close($ch);
        }

        curl_multi_close($multiHandle);

        return $results;
    }

    /**
     * Deletes an image from Cloudinary using REST API
     */
    public static function deleteImage($url) {
        $publicId = self::extractPublicId($url);
        
        if (!$publicId) {
            return false;
        }

        if (CLOUDINARY_API_KEY === 'YOUR_API_KEY_HERE' || CLOUDINARY_API_SECRET === 'YOUR_API_SECRET_HERE') {
            // Cannot delete, credentials not configured
            error_log("Cloudinary API credentials not configured. Cannot delete image.");
            return false;
        }

        $timestamp = time();
        $stringToSign = "public_id=" . $publicId . "&timestamp=" . $timestamp . CLOUDINARY_API_SECRET;
        $signature = sha1($stringToSign);

        $postFields = [
            'public_id' => $publicId,
            'api_key' => CLOUDINARY_API_KEY,
            'timestamp' => $timestamp,
            'signature' => $signature
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://api.cloudinary.com/v1_1/" . CLOUDINARY_CLOUD_NAME . "/image/destroy");
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true);
        
        return $httpCode == 200 && isset($result['result']) && $result['result'] === 'ok';
    }
}
