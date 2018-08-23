const app = require('express')();
const pug = require('pug');
const phantom = require('phantom');
const fs = require('fs');

const base64_encode = (file, cb) => {
  fs.readFile(file, (err, data) => {
    cb(new Buffer(data).toString('base64'));
  })
}

const deleteTmpArchive = (file) => {
  fs.unlink(file)
}

const createPDF = (name, cb)=> {
  let instance = null;
  let page = null;

  phantom
    .create()
    .then((phantomInstance) => {
      instance = phantomInstance;
      return instance.createPage();
    })
    .then((pageCreated) => {
      page = pageCreated;
      return page.property('paperSize', { format: 'A4', orientation: 'portrait', margin: '1cm' })
    })
    .then(() => {
      const html = pug.renderFile('prueba.pug', { dato: name });
      console.log(html);
      return page.property('content', html);
    })
    .then(() => {
      name = __dirname + '/upload/'+ name + '.pdf';
      return page.render(name);
    })
    .then((result) => {
      page.close();
      instance.exit();
      base64_encode(name, (base64_file) => {
        if(result){
          deleteTmpArchive(name);
          return cb(null, base64_file);
        }
        return cb({ error: ' no hay resultado' })
      });
    })
    .catch((e) => {
      console.log('Error: \n', e)
      cb(e)
    })
}

app.get('/:name', (req, res) => {
  const name = req.params.name ? req.params.name : 'no_name';
  console.log(name);
  createPDF(name, (err, file) => {
    if(err) return res.status(500).send(err);
    let finished = false;
    res.setHeader('Content-type', 'application/pdf')
    res.write(file, 'base64', () => {
      res.end();
    })
  });
})


app.listen(3000, () => console.log('Conectado'))