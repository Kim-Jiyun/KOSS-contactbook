var express = require('express')
var app = express()
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var sanitizeHtml = require('sanitize-html');
var template = require('./lib/template.js');

//기본페이지
app.get('/', function(request, response) { 
  fs.readdir('./data', function(error, filelist){
    var title = 'KOSS';
    var description = '비상연락망';
    var list = template.list(filelist);
    var html = template.HTML(title, list,
      `<h2>${title}</h2>${description}`,
    ); 
    response.send(html);
  });
})

//Index 눌렀을때 전체 연락처 조회
app.get('/contacts', function(request, response) { 
  fs.readdir('./data', function(error, filelist){
    var title = 'Index';
    var list = template.list(filelist);
    var html = template.HTML(title, list,
      `<h2>${title}</h2>${list}`,
    ); 
    response.send(html);
  });
})

//New 눌렀을 때 신규 연락처 생성 폼 조회
app.get('/contacts/new', function(request, response) { 
  fs.readdir('./data', function(error, filelist){
    var title = 'New';
    var list = template.list(filelist);
    var html = template.HTML(title, list,
      `
      <form action="/contacts" method="post">
        <h2>${title}</h2>
        <p>Name</p><input type="text" name="name"></p>
        <p>Email, Phone</p><textarea name="description"></textarea></p>
        <p><input type="submit" value="Submit"></p>
      </form>
    `, '');
    response.send(html);
  });
})

//신규연락처 생성
app.post('/contacts', function(request, response){
  var body = '';
  request.on('data', function(data){
      body = body + data;
  });
  request.on('end', function(){
      var post = qs.parse(body);
      var title = post.name;
      var description = post.description;
      fs.writeFile(`data/${title}`,`${description}`, 'utf8', function(err){
        response.writeHead(302, {Location: encodeURI(`/?id=${title}`)});
        response.end();
      })
  });
});

//특정 연락처 상세 정보 조회
app.get('/contacts/:pageId', function(request, response) { 
  fs.readdir('./data', function(error, filelist){
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
      var title = request.params.pageId;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description);
      var list = template.list(filelist);
      var html = template.HTML(sanitizedTitle, list,
        `<h1>Show</h1>
        <h2>${sanitizedTitle}</h2>
        <P>Email, Phone</p>    
        <p>${description}</p>
        <a href="/contacts/${title}/edit">Edit</a>
        <form action="/contacts/:pageId/delete" method="post">
          <input type="hidden" name="id" value="${sanitizedTitle}">
          <input type="submit" value="Delete">
        </form>
        `
      );
      response.send(html);
    });
  });
});


//특정 연락처 수정 폼 제공
app.get('/contacts/:pageId/edit', function(request, response){
  fs.readdir('./data', function(error, filelist){
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
      var title = request.params.pageId;
      var list = template.list(filelist);
      var html = template.HTML(title, list,
        `
        <form action="/contacts/:pageId" method="post">
          <input type="hidden" name="id" value="${title}">
          <h1>Edit</h1>
          <p>Name</p><input type="text" name="name" value="${title}"></p>
          <p>Email, Phone</p><textarea name="description" value=${description}></textarea></p>
          <p><input type="submit" value="Submit"></p>
        </form>
        `, ''
      );
      response.send(html);
    });
  });
});

//전달받은 정보를 바탕으로 특정 연락처 정보수정
app.post('/contacts/:pageId', function(request, response){
  var body = '';
  request.on('data', function(data){
      body = body + data;
  });
  request.on('end', function(){
      var post = qs.parse(body);
      var id = post.id;
      var title = post.name;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function(error){
        fs.writeFile(`data/${title}`, `${description}`, 'utf8', function(err){
          response.redirect(`/?id=${title}`);
        })
      });
  });
});

//연락처 삭제
app.post('/contacts/:pageId/delete', function(request, response){
  var body = '';
  request.on('data', function(data){
      body = body + data;
  });
  request.on('end', function(){
      var post = qs.parse(body);
      var id = post.id;
      var filteredId = path.parse(id).base;
      fs.unlink(`data/${filteredId}`, function(error){
        response.redirect('/contacts');
      })
  });
});

app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});
 
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});
 
app.listen(3000, function() {
  console.log('Example app listening on port 3000!')
});
