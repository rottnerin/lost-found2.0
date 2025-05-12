<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$imageUrl = $data['imageUrl'] ?? null;

if (!$imageUrl) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid image URL provided']);
    exit;
}

// Load environment variables
$openaiKey = getenv('OPENAI_API_KEY');

if (!$openaiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'OpenAI API key not configured']);
    exit;
}

// Decode URL if already encoded
$decodedUrl = urldecode($imageUrl);

// Prepare OpenAI API request
$payload = [
    'model' => 'gpt-4o-mini',
    'messages' => [
        [
            'role' => 'user',
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Describe this found item in JSON format with fields: name (short title), description (characteristics and condition), tags (2-3 keywords)'
                ],
                [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => $decodedUrl
                    ]
                ]
            ]
        ]
    ],
    'max_tokens' => 500,
    'response_format' => ['type' => 'json_object']
];

// Make request to OpenAI API
$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $openaiKey
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 60
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to analyze image']);
    exit;
}

$result = json_decode($response, true);
$analysis = json_decode($result['choices'][0]['message']['content'], true);

// Format response
$formattedAnalysis = [
    'name' => $analysis['name'] ?? '',
    'description' => $analysis['description'] ?? '',
    'tags' => is_array($analysis['tags'] ?? null) ? $analysis['tags'] : []
];

echo json_encode($formattedAnalysis);
?>