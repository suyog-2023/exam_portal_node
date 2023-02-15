var express = require("express");
var router = express.Router();
var execute = require("./../connection");
var url = require("url");
router.get("/", function (req, res) {
    console.log(req.session);
        res.render("admin/home.ejs");
});


router.get("/admin_login", function (req, res) {
    if (req.session.admin_tbl_id != undefined)
        var adminName = req.session.admin_name;
    else
        var adminName = undefined;

    var obj = { "adminName": adminName };
    res.render("admin/admin_login.ejs", obj);
});

router.post("/register_admin", async function (req, res) {
    // var sql=`CREATE TABLE admin_tbl(admin_tbl_id INT PRIMARY KEY AUTO_INCREMENT, admin_name VARCHAR(200),mobile VARCHAR(20),password VARCHAR(200))`;
    var d = req.body;
    var sql = `INSERT INTO admin_tbl(admin_name,mobile,password) VALUES ('${d.admin_name}','${d.mobile}','${d.password}')`;
    await execute(sql);
    res.send(`
        <script>
            alert('Account Created');
            window.location.href='/login_now';
        </script>
    `);
});

router.post("/login_now", async function (req, res) {
    var sql=`SELECT * FROM admin_tbl WHERE mobile='${req.body.mobile}' AND password='${req.body.password}'`;

    var data = await execute(sql);
    if (data.length > 0) {
        req.session.admin_tbl_id = data[0]['admin_tbl_id'];
        req.session.admin_name = data[0]['admin_name'];
        res.redirect("/admin/home.ejs");
    }
    else {
        res.send(`
        <script>
            alert('Login Failed');
            window.location.href='/admin/admin_login';
        </script>
    `);
    }
});


router.get("/manage_subject", async function (req, res) {
    var subjects = await execute("SELECT * FROM student");
    var obj = { "subjects": subjects }
    res.render("admin/manage_subject.ejs", obj);
});


router.post("/save_subject", async function (req, res) {
    var sql = `INSERT INTO student(subject_name) VALUES ('${req.body.subject_name}')`;
    await execute(sql);
    res.redirect("/admin/manage_subject");
});

router.get("/add_question", async function (req, res) {
    var subjects = await execute("SELECT * FROM student");
    var obj = { "subjects": subjects }
    res.render("admin/add_question.ejs", obj);
});


router.post("/save_question", async function (req, res) {
    // var sql = `CREATE TABLE question_tbl(question_tbl_id INT PRIMARY KEY AUTO_INCREMENT, question TEXT, option_a TEXT, option_b TEXT, option_c TEXT,option_d TEXT, ans_desc TEXT, correct_ans VARCHAR (5), subject_id INT )`;
    var d = req.body;
    var sql = `INSERT INTO question_tbl(question, option_a, option_b, option_c,option_d, ans_desc, correct_ans,subject_id) VALUES ('${d.question}', '${d.option_a}', '${d.option_b}', '${d.option_c}', '${d.option_d}', '${d.ans_desc}', '${d.correct_ans}', '${d.subject_id}')`;
    await execute(sql);
    res.redirect("/admin/question_list");
});


router.get("/question_list", async function (req, res) {
    var urlData = url.parse(req.url, true).query;
    if (urlData.subject_id != undefined) {
        var active_tab = urlData.subject_id;

        var data = await execute(`SELECT * FROM question_tbl, student WHERE student.subject_id=question_tbl.subject_id AND question_tbl.subject_id='${urlData.subject_id}'`);       //JOIN 
    } else {
        var active_tab = "All";
        var data = await execute("SELECT * FROM question_tbl, student WHERE student.subject_id=question_tbl.subject_id");       //JOIN 
    }
    var subjects = await execute("SELECT * FROM student");
    var obj = { "questions": data, "subjects": subjects, "active_tab": active_tab };
    res.render("admin/question_list.ejs", obj)
});


router.get("/question_details/:question_id", function (req, res) {
    res.send(req.params.question_id)
});

router.get("/create_test", async function (req, res) {
    var subjects = await execute("SELECT * FROM student");
    var obj = { "subjects": subjects };
    res.render("admin/create_test.ejs", obj);
});

router.post("/save_test", async function (req, res) {
    var fname = req.files.test_image.name;
    req.files.test_image.mv('public/uploads/' + fname);
    // var sql = `CREATE TABLE test (test_id INT PRIMARY KEY AUTO_INCREMENT, 
    //             test_title VARCHAR(100),
    //             subject_id INT, 
    //             no_of_questions INT, 
    //             mark_p_que INT,
    //             total_marks INT, 
    //             test_duration INT,
    //             test_image TEXT
    //             )`;
    var d = req.body;
    var sql = `INSERT INTO test (test_title, subject_id, no_of_questions,mark_p_que,total_marks,test_duration,test_image) VALUES ('${d.test_title}', '${d.subject_id}','${d.no_of_questions}','${d.mark_p_que}','${d.total_marks}','${d.test_duration}','${fname}')`;

    await execute(sql);
    // res.send(req.body);
    res.redirect("/admin/create_test");
});

router.get("/test_list", async function (req, res) {
    var sql = `SELECT * FROM test, student WHERE test.subject_id=student.subject_id`;
    var data = await execute(sql)
    var obj = { "test_list": data }
    res.render("admin/test_list.ejs", obj);
});

module.exports = router;