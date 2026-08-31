<?php

$statefulDomains = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env(
        'SANCTUM_STATEFUL_DOMAINS',
        'localhost:4200,localhost:8080',
    )),
)));

return [
    'stateful' => $statefulDomains,

    'guard' => ['web'],
];
