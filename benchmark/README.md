# Benchmark for try-to-result vs try

---

| case                        | try ops/sec | try-to-result ops/sec | winner        | % faster |
| --------------------------- | ----------- | --------------------- | ------------- | -------- |
| JSON.parse - ok (destr)     | 4,107,814   | 4,202,991             | try-to-result | 2.317    |
| JSON.parse - throws (destr) | 155,474     | 152,052               | try           | 2.250    |
| JSON.parse - ok (props)     | 5,714,545   | 5,828,855             | try-to-result | 2.000    |
| JSON.parse - throws (props) | 164,071     | 156,891               | try           | 4.576    |
| Div - ok                    | 14,859,249  | 14,542,091            | try           | 2.181    |
| Div - throws                | 188,062     | 196,486               | try-to-result | 4.479    |
| Div - Result.ok             | 15,153,684  | 15,485,361            | try-to-result | 2.189    |
| Div - Result.error          | 15,674,030  | 16,177,234            | try-to-result | 3.210    |

---

| case                        | try ops/sec | try-to-result ops/sec | winner        | % faster |
| --------------------------- | ----------- | --------------------- | ------------- | -------- |
| JSON.parse - ok (destr)     | 4,079,765   | 4,217,986             | try-to-result | 3.388    |
| JSON.parse - throws (destr) | 158,191     | 153,098               | try           | 3.327    |
| JSON.parse - ok (props)     | 5,740,828   | 5,842,907             | try-to-result | 1.778    |
| JSON.parse - throws (props) | 164,101     | 159,502               | try           | 2.884    |
| Div - ok                    | 14,907,775  | 14,989,144            | try-to-result | 0.546    |
| Div - throws                | 188,956     | 197,692               | try-to-result | 4.623    |
| Div - Result.ok             | 15,191,286  | 15,577,306            | try-to-result | 2.541    |
| Div - Result.error          | 15,521,710  | 16,017,400            | try-to-result | 3.194    |