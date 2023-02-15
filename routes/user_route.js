var express=require("express");
var router=express.Router();
var execute=require("./../connection");
var url=require("url");
router.get("/",function(req,res)
{
    if(req.session.user_tbl_id!=undefined)
        var username=req.session.user_name;
    else
        var username=undefined;
    
    var obj={"username":username};
    res.render("user/home.ejs",obj);
});

router.get("/login",function(req,res){
    if(req.session.user_tbl_id!=undefined)
        var username=req.session.user_name;
    else
        var username=undefined;

    var obj={"username":username};
    res.render("user/login.ejs",obj);
});

router.post("/register_user",async function(req,res)
{
    // var sql=`CREATE TABLE user_tbl(user_tbl_id INT PRIMARY KEY AUTO_INCREMENT, user_name VARCHAR(200),mobile VARCHAR(20),password VARCHAR(200))`;
    var d=req.body;
    var sql=`INSERT INTO user_tbl(user_name,mobile,password) VALUES ('${d.user_name}','${d.mobile}','${d.password}')`;
    await execute(sql);
    res.send(`
        <script>
            alert('Account Created');
            window.location.href='/login';
        </script>
    `);
});

router.post("/login_now",async function(req,res)
{
    var sql=`SELECT * FROM user_tbl WHERE mobile='${req.body.mobile}' AND  password='${req.body.password}'`;

    var data=await execute(sql);
    if(data.length>0)
    {
        req.session.user_tbl_id=data[0]['user_tbl_id']
        req.session.user_name=data[0]['user_name']
        res.redirect("/");
    }
    else
    {
        res.send(`
        <script>
            alert('Login Failed');
            window.location.href='/login';
        </script>
    `);  
    }
});

router.get("/join_test",async function(req,res)
{
    if(req.session.user_tbl_id!=undefined)
        var username=req.session.user_name;
    else
        var username=undefined;

    var test_list=await execute("SELECT * FROM test");

    if(username!=undefined)
    {
        var obj={"username":username,"test_list":test_list};
        res.render("user/join_test.ejs",obj);
    }
    else
    {
        res.send(`
        <script>
            alert('Login Failed');
            window.location.href='/login';
        </script>
    `);   
    }
});

router.get("/start_test/:test_id",async function(req,res)
{   
    if(req.session.user_tbl_id!=undefined)
    var username=req.session.user_name;
    else
        var username=undefined;

    var test_list=await execute("SELECT * FROM test");

    if(username!=undefined)
    {
    var user_id=req.session.user_id;   
    var test_id=req.params.test_id;
    var date=new Date();
    var test_start_date=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
    var test_det=await execute(`SELECT * FROM test WHERE test_id='${test_id}'`);
    var test_total_time=test_det[0]['test_duration'];
    var test_total_marks=test_det[0]['total_marks'];
    var test_total_questions=test_det[0]['no_of_questions'];
    var marks_per_question=test_det[0]['mark_p_que'];
    var obtain_mark='0';
    var test_submit_time="";

    var test_start_time=parseInt(date.getTime()/1000);

    // var sql=`CREATE TABLE user_test(user_test_id INT PRIMARY KEY AUTO_INCREMENT,user_id INT,test_id INT,test_start_date VARCHAR(200),test_start_time VARCHAR(20),test_total_time VARCHAR(20),test_total_marks VARCHAR(20),test_total_questions VARCHAR(20),marks_per_question VARCHAR(20),obtain_mark VARCHAR(20),test_submit_time VARCHAR(20),test_status VARCHAR(20))`;
    
    var sql=`INSERT INTO user_test(user_id,test_id,test_start_date,test_start_time,test_total_time,test_total_marks,test_total_questions,marks_per_question,obtain_mark,test_submit_time,test_status) 
    VALUES ('${user_id}','${test_id}','${test_start_date}','${test_start_time}','${test_total_time}','${test_total_marks}','${test_total_questions}','${marks_per_question}','${obtain_mark}','${test_submit_time}','active')`;
    // console.log(sql);
    var data=await execute(sql);
    // console.log(data);

    var user_test_id=data.insertId;
    var subject_id=test_det[0]['subject_id'];
    var questions=await execute(`SELECT * FROM question_tbl WHERE subject_id='${subject_id}'`);

    for(i=0;i<test_det[0]['no_of_questions'];i++)
    {
        if(questions[i]!=undefined)
        {
            var question_id=questions[i]['question_tbl_id'];
            var provided_ans="";
            var check_ans="false";
            var attempted="no";
            var question_start_time="";

            // var sql=`CREATE TABLE user_test_question (user_test_id INT PRIMARY KEY AUTO_INCREMENT,user_id INT,question_id INT,test_id INT,provided_ans VARCHAR(10),check_ans VARCHAR(10),attempted VARCHAR(10),question_start_time VARCHAR(20))`;

            var sql=`INSERT INTO user_test_questions(user_test_id,user_id,question_id,test_id,provided_ans,check_ans,attempted,question_start_time) VALUES ('${user_test_id}','${user_id}','${question_id}','${test_id}','${provided_ans}','${check_ans}','${attempted}','${question_start_time}')`;

            // console.log(sql);
            await execute(sql);
        }
    }
// user_test_questions -> user_test_id, user_id, question_id, test_id, provided_ans, check_ans,attempted,question_start_time
    
    res.redirect("/test_open/"+user_test_id);
    }
    else
    {
        res.send(`
        <script>
            alert('Login Failed');
            window.location.href='/login';
        </script>
    `);   
    }
});
router.get("/test_open/:user_test_id",async function(req,res)
{
    var user_test_id=req.params.user_test_id;
    var sql=`SELECT * FROM user_test_questions WHERE user_test_id='${user_test_id}' AND attempted='yes'`;

    var attempt_questions=await execute(sql);
    var attempted=attempt_questions.length;
    
    var sql=`SELECT * FROM user_test_questions,question_tbl WHERE user_test_questions.question_id=question_tbl.question_tbl_id AND user_test_id='${user_test_id}' AND attempted='no'`;
    var date=new Date();
var question_start_time=date.getHours()+":"+date.getMinutes()+":"+date.getMinutes();
    
    var data=await execute(sql);

    if(data.length>0)
    {
        var sql=`UPDATE user_test_questions SET attempted='yes',question_start_time='${question_start_time}' WHERE user_test_question_id='${data[0]['user_test_question_id']}'`;

        await execute(sql);

var start_time=await execute("SELECT * FROM user_test WHERE user_test_id='"+user_test_id+"'");

        var obj={"questions":data,"que_no":attempted+1,"start_time":start_time[0].
        test_start_time};
        res.render("user/test_open.ejs",obj);
    }
    else
    {
        res.redirect("/result/"+user_test_id);
    }
});
router.post("/submit_user_answer",async function(req,res){
    sql=`SELECT * FROM question_tbl WHERE question_tbl_id='${req.body.question_id}'`;
    var question_det = await execute(sql);
    if(question_det[0]['correct_ans']==req.body.provided_ans)
    {
        var check_ans="true";
    }
    else
    {
        var check_ans="false";
    }
    var provided_ans=req.body.provided_ans;

    var sql=`UPDATE user_test_questions SET provided_ans='${provided_ans}',check_ans='${check_ans}' WHERE user_test_question_id='${req.body.user_test_question_id}'`;
    await execute(sql);
    res.redirect("/test_open/"+req.body.user_test_id);
});

router.get("/result/:user_test_id",async function(req,res)
{
    sql=`SELECT * FROM user_test WHERE user_test_id='${req.params.user_test_id}'`;
    var test_det=await execute(sql);

    var attempted=await execute(`SELECT count(user_test_question_id) as ttl FROM user_test_questions WHERE attempted='yes' AND user_test_id='${req.params.user_test_id}'`);

    var correct_ans=await execute(`SELECT count(user_test_question_id) as ttl FROM user_test_questions WHERE check_ans='true' AND user_test_id='${req.params.user_test_id}'`);

    obtain_mark=correct_ans[0]['ttl']*test_det[0]['marks_per_question'];

    var obj={"total_marks":test_det[0]['test_total_marks'],"obtain_marks":obtain_mark}
    res.render("user/result.ejs",obj);
});
module.exports = router;