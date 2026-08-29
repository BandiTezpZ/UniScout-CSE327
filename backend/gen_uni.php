<?php
$csv = array_map('str_getcsv', file('C:\Users\This PC\Downloads\UniScout_1.5.1\UniScout_1.5\backend\data\universities.csv'));
$headers = array_shift($csv);
$headers[0] = str_replace("\xEF\xBB\xBF", '', $headers[0]); // strip BOM

$sql = "\n\n";

function esc($str) {
    if ($str === null || $str === '') return "NULL";
    return "'" . addslashes((string)$str) . "'";
}

$id = 1;
foreach ($csv as $row) {
    if (count($row) !== count($headers)) continue;
    $uni = array_combine($headers, $row);
    if (empty($uni['university_name'])) continue;

    $sql .= "INSERT INTO universities (id, university_name, country, state, program, rank_tier, tuition_usd, living_cost_usd, cost_of_attendance_usd, min_cgpa, min_ielts, min_gre, accepts_without_gre, research_level, ms_cs, research_category, intake, deadline, data_note) VALUES (" .
            esc($id) . ", " . esc($uni['university_name']) . ", " . esc($uni['country'] ?? 'USA') . ", " .
            esc($uni['state']) . ", " . esc($uni['program']) . ", " . (int)$uni['rank_tier'] . ", " .
            (float)($uni['tuition_usd'] ?? 0) . ", " . (float)($uni['living_cost_usd'] ?? 0) . ", " .
            (float)($uni['cost_of_attendance_usd'] ?? 0) . ", " . (float)($uni['min_cgpa'] ?? 0) . ", " .
            (float)($uni['min_ielts'] ?? 0) . ", " . (int)($uni['min_gre'] ?? 0) . ", " .
            esc($uni['accepts_without_gre']) . ", " . (int)($uni['research_level'] ?? 0) . ", " .
            esc($uni['ms_cs']) . ", " . esc($uni['research_category']) . ", " .
            esc($uni['intake']) . ", " . esc($uni['deadline']) . ", " . esc($uni['data_note']) . ") ON DUPLICATE KEY UPDATE university_name=VALUES(university_name);\n";
    $id++;
}

file_put_contents('C:\Users\This PC\Downloads\UniScout_1.5.1\UniScout_1.5\backend\migrate.sql', $sql, FILE_APPEND);
echo "Appended universities SQL";
?>
