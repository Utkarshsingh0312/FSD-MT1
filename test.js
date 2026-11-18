const http = require('http');
const app = require('./server');

const server = http.createServer(app);

const PORT = 3001;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  server.listen(PORT, async () => {
    console.log(`\n========================================`);
    console.log(` RUNNING TESTS FOR EVENT REGISTRATION API `);
    console.log(`========================================\n`);

    let passed = 0;
    let failed = 0;

    function assert(condition, testName, details = '') {
      if (condition) {
        console.log(`[PASS] ${testName}`);
        passed++;
      } else {
        console.error(`[FAIL] ${testName} - ${details}`);
        failed++;
      }
    }

    try {
      // 1. GET all records
      const getAllRes = await request('GET', '/api/registrations');
      assert(getAllRes.status === 200 && Array.isArray(getAllRes.data) && getAllRes.data.length === 3,
        '1. GET /api/registrations returns 3 initial records with 200',
        JSON.stringify(getAllRes));

      // 2. Filter records (case-insensitive)
      const filterRes1 = await request('GET', '/api/registrations/filter?department=cse');
      assert(filterRes1.status === 200 && filterRes1.data.length === 1 && filterRes1.data[0].department === 'CSE',
        '2. GET /api/registrations/filter?department=cse (case-insensitive) returns matching records',
        JSON.stringify(filterRes1));

      // Filter with no matches
      const filterRes2 = await request('GET', '/api/registrations/filter?department=Mechanical');
      assert(filterRes2.status === 200 && Array.isArray(filterRes2.data) && filterRes2.data.length === 0,
        '3. GET /api/registrations/filter?department=Mechanical returns empty array with 200',
        JSON.stringify(filterRes2));

      // 3. GET pending registrations
      const pendingRes = await request('GET', '/api/registrations/pending');
      assert(pendingRes.status === 200 && Array.isArray(pendingRes.data) && pendingRes.data.length === 1 && pendingRes.data[0].id === 502,
        '4. GET /api/registrations/pending returns Pending registrations with 200',
        JSON.stringify(pendingRes));

      // 4. GET registration by ID
      const getByIdRes = await request('GET', '/api/registrations/501');
      assert(getByIdRes.status === 200 && getByIdRes.data.participantName === 'Riya Sharma',
        '5. GET /api/registrations/501 returns correct record with 200',
        JSON.stringify(getByIdRes));

      // GET non-existent ID
      const getByIdNotFound = await request('GET', '/api/registrations/999');
      assert(getByIdNotFound.status === 404,
        '6. GET /api/registrations/999 returns 404 for non-existent ID',
        JSON.stringify(getByIdNotFound));

      // 5. POST a new record (valid)
      const newRecord = {
        participantName: "Karan Singh",
        eventName: "AI Workshop",
        department: "CSE",
        ticketCount: 2,
        paymentStatus: "Pending"
      };
      const postRes = await request('POST', '/api/registrations', newRecord);
      assert(postRes.status === 201 && postRes.data.id === 504 && postRes.data.participantName === 'Karan Singh',
        '7. POST /api/registrations adds new record and returns 201 with generated id (504)',
        JSON.stringify(postRes));

      // POST invalid (negative ticketCount)
      const postInvalidTickets = await request('POST', '/api/registrations', {
        ...newRecord,
        ticketCount: -1
      });
      assert(postInvalidTickets.status === 400,
        '8. POST /api/registrations rejects negative ticketCount with 400',
        JSON.stringify(postInvalidTickets));

      // POST invalid (invalid paymentStatus)
      const postInvalidStatus = await request('POST', '/api/registrations', {
        ...newRecord,
        paymentStatus: "Completed"
      });
      assert(postInvalidStatus.status === 400,
        '9. POST /api/registrations rejects invalid paymentStatus with 400',
        JSON.stringify(postInvalidStatus));

      // 6. PUT / update a record
      const updatePayload = {
        participantName: "Riya Sharma",
        eventName: "Tech Fest",
        department: "CSE",
        ticketCount: 3,
        paymentStatus: "Paid"
      };
      const putRes = await request('PUT', '/api/registrations/501', updatePayload);
      assert(putRes.status === 200 && putRes.data.ticketCount === 3,
        '10. PUT /api/registrations/501 updates record successfully with 200',
        JSON.stringify(putRes));

      // PUT non-existent ID
      const putNotFound = await request('PUT', '/api/registrations/888', updatePayload);
      assert(putNotFound.status === 404,
        '11. PUT /api/registrations/888 returns 404 for non-existent ID',
        JSON.stringify(putNotFound));

      // 7. DELETE a record
      const deleteRes = await request('DELETE', '/api/registrations/502');
      assert(deleteRes.status === 200,
        '12. DELETE /api/registrations/502 deletes record with 200',
        JSON.stringify(deleteRes));

      // DELETE non-existent ID
      const deleteNotFound = await request('DELETE', '/api/registrations/502');
      assert(deleteNotFound.status === 404,
        '13. DELETE /api/registrations/502 on already deleted record returns 404',
        JSON.stringify(deleteNotFound));

      // Verify deletion in GET all
      const finalGetAll = await request('GET', '/api/registrations');
      assert(finalGetAll.status === 200 && !finalGetAll.data.some(r => r.id === 502),
        '14. GET /api/registrations confirms 502 is no longer in array',
        JSON.stringify(finalGetAll));

    } catch (err) {
      console.error("Test execution error:", err);
      failed++;
    } finally {
      server.close(() => {
        console.log(`\n========================================`);
        console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
        console.log(`========================================\n`);
        process.exit(failed > 0 ? 1 : 0);
      });
    }
  });
}

runTests();
