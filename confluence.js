const rp = require('request-promise');
const $ = require('cheerio');
const download = require('download-file');
var fs = require('fs');

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1;
  var dd = this.getDate();
  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

var url = 'https://inswave.com/confluence/plugins/pagetree/naturalchildren.action?decorator=none&excerpt=false&sort=position&reverse=false&disableLinks=false&expandCurrent=false&hasRoot=true&pageId=9667141&treeId=1&startDepth=0&mobile=false&ancestors=9667141&treePageId=9667141&_=1607330502531';
var prom = Promise.resolve();
var page_urls = [];
var pdf_urls = [];
var pdf_names = [];
var folder_names = [];
var base_folder = (new Date()).yyyymmdd();
var folder_idx = {};

prom = prom.then(function() {
  return rp(url).then(function(html){
    var prevFolder = "";
    $('.plugin_pagetree_children_span > a', html).each(function(idx) {
      var link =  $( this ).attr('href');
      var name = $( this ).text();
      name = name.replace(/[/]/g,',');
      name = name.replace(/["']+/g,'');
      var folder_prefix = name.substring(name.indexOf("[")+1, name.indexOf("]"));
      folder_prefix = folder_prefix.replace(/[ ]+/g,'');
      if( !folder_idx[folder_prefix.toLocaleLowerCase()] ) {
        folder_idx[folder_prefix.toLocaleLowerCase()] = 0
      }

      var i = ++folder_idx[folder_prefix.toLocaleLowerCase()];
      var idxStr =  ("000" + i);
      idxStr = idxStr.substring(idxStr.length-3);

      var folder = base_folder + "/" + folder_prefix + "-" + idxStr;
      folder_names.push(folder);
      var page_url = "https://inswave.com" + link;
      var pdf_url = "https://inswave.com/confluence/spaces/flyingpdf/pdfpageexport.action?pageId=" + link.substring(link.lastIndexOf("=")+1);
      page_urls.push(page_url)
      pdf_urls.push(pdf_url)
      pdf_names.push(name + ".pdf");
      prevFolder = folder_prefix;
      //console.log(folder + "/" + name);
    });
  })
  .catch(function(err){
    console.log(err);
  });
});

prom = prom.then(function() {
  var prom1 = Promise.resolve();
  for(var idx =  0 ; idx < folder_names.length; idx++) {
    (function(idx1) {
      if (!fs.existsSync(folder_names[idx1])) {
        fs.mkdirSync(folder_names[idx1], {recursive: true});
      }
      
      prom1 = prom1.then(function() {
        return rp(page_urls[idx1]).then(function(html){
          var tmpResolve = null;
          var subPromise = new Promise(function(resolve, reject) {
            tmpResolve = resolve;
          });
          $('div#content.page a', html).each(function(idx) {
            var link =  $( this ).attr('href');
            if( link.indexOf("/confluence/download") > -1 ) {
              if( !link.startsWith("https://inswave.com") ) {
                link = "https://inswave.com" + link;
              }
              var link_name = link.substring(link.lastIndexOf("/")+1, link.indexOf("?"));
              //console.log("리소스 다운로드 시도[" + idx1 + "] : " + folder_names[idx1] + "/" + link_name, link);
              return download(link, {directory:folder_names[idx1], filename:link_name},function(err){
                if (err) {
                  console.log("리소스 다운로드 실패[" + idx1 + "] : " + folder_names[idx1] + "/" + link_name, link, err);
                } else {
                  console.log("리소스 다운로드 성공[" + idx1 + "] : " + folder_names[idx1] + "/" + link_name);
                }
              });
            }
          });
          var request = require("https").get(pdf_urls[idx1], function(res) {
            //console.log("PDF 다운로드 시도[" + idx1 + "] : " + folder_names[idx1] + "/" + pdf_names[idx1]);
            if(res.headers.location) {
              return download(res.headers.location, {directory:folder_names[idx1], filename:pdf_names[idx1]},function(err){
                if (err) {
                  console.log("PDF 다운로드 실패[" + idx1 + "] : " + folder_names[idx1] + "/" + pdf_names[idx1], res.headers.location, err);
                } else {
                  console.log("PDF 다운로드 성공[" + idx1 + "] : " + folder_names[idx1] + "/" + pdf_names[idx1]);
                }
                tmpResolve();
              });          
            } else {
              console.log("NO PDF Download Link : " + folder_names[idx1] + "/" + pdf_names[idx1], pdf_urls[idx1]);
              tmpResolve();
            }
          });
          request.on('error', function(e) {
            console.log("Got error: " + e.message);
          });
          return subPromise;
        })
        .catch(function(err){
          console.log(err);
        });        
      }).catch(function(err){
        console.log(err);
      });
    })(idx);
  }  
})
