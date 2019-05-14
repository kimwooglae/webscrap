const rp = require('request-promise');
const $ = require('cheerio');
const moment = require('moment');
const download = require('download-file');
var fs = require('fs');

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

Date.prototype.yyyymmdd1 = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return this.getFullYear() + "년 " + mm + "월 " + dd + "일";
};


var url = 'http://www.itfind.or.kr/publication/regular/weeklytrend/pastList/read.do?selectedCategory=B_ITA_01&selectedId=';


var idx = 1061;
var prom = Promise.resolve();
var destPath = "/Users/wlkim/Dropbox/4.Professional Engineer(2019)/2.기술자료/";

// 7654 : 2019년 2월 1일   5G와 자율차동차로 촉발될 미디어의 미래 먹거리 기회
// 7631 : 2019년 1월 15일     VR · AR · MR 관련 기술 및 정책 동향

// 1063 : 2019년 2월 6일 1882호
// 1060 : 2019년 1월 16일 1879호
// 1059 : 2018년 12월 26일 1878호


//for(idx =  7649 ; idx > 1062; idx--) {  // 7648
//for(idx =  1062 ; idx > 0; idx--) {


fs.writeFileSync(destPath + '주간기술동향_요약(통합)/2019년_주간기술동향.txt', "", 'utf8');
fs.writeFileSync(destPath + '주간기술동향_요약(TTS)/2019년_주간기술동향_TTS.txt', "", 'utf8');
fs.writeFileSync('주간기술동향_제목_link.txt', "", 'utf8');

var iii = 1080; // 주단위 목록 최종 번호

// 통합 파일 다운로드
for(idx =  iii ; idx > 1059; idx--) {
  if(idx == 1070) continue;
  (function(idx1) {
    prom = prom.then(function() {
    return rp(url + idx1)
      .then(function(html){
        //success!
        //console.log(html);
        console.log("connected + " + idx1);
        var title = $('.tit_view > dd', html).text();
        var date = $('.info_view2 > dd:nth-of-type(2n)', html).text();
        date = date.substring(4,10) + ', ' + date.substring(24) ;
        date1 = new Date(Date.parse(date));
        if(date1 < new Date("Jan 1, 2019")) {
          console.log("skip [" + date + "]");
          return;
        }
        var pdf_url = 'http://www.itfind.or.kr'+ $('.file_view > dd > a', html)[0].attribs.href;
        var content = $('.view_cont > dl', html).text().replace(/    /gi,'').replace(/원문 바로가기|원문정보/gi, '');
        content = content.replace(/\n\n\n\n/gi,'\n');

        var tmpResolve = null;
        var subPromise = new Promise(function(resolve, reject) {
          tmpResolve = resolve;
        });
        var msg = title + '  ' + date1.yyyymmdd() + "\n=============================\n\n" + content.trim() + "\n\n" + pdf_url + "\n\n" + url + idx1 + "\n\n";
        var filename = date1.yyyymmdd() + "_" + title.replace(/[\/]/gi,'') + '.pdf';
        var path = destPath + '주간기술동향_pdf(주간)/' + filename;
        if( !fs.existsSync(path) ) {
          download(pdf_url, {filename:filename},function(err){
            if (err) console.log("errored " + date1.yyyymmdd() + "_" + title.replace(/[\/]/gi,'') + '.pdf');
            fs.renameSync(filename, path);
            fs.writeFileSync(destPath + '주간기술동향_요약/' + date1.yyyymmdd() + "_" + title.replace('/','') + '.txt', msg, 'utf8');
            console.log("downloaded [" + idx1 + "] : " + path);
            tmpResolve();
          });
        } else {
          console.log("already exist [" + idx1 + "] : " + path);
          tmpResolve();
        }

        fs.appendFileSync(destPath + '주간기술동향_요약(통합)/' + date1.getFullYear() + '년_주간기술동향.txt', msg, 'utf8');

        var msg1 = title + '  ' + date1.yyyymmdd1() + "\n\n" + content.trim() + "\n\n";
        fs.appendFileSync(destPath + '주간기술동향_요약(TTS)/' + date1.getFullYear() + '년_주간기술동향_TTS.txt', msg1, 'utf8');

        return subPromise;
      })
      .catch(function(err){
        //handle error
      });
    });
  })(idx);
}

// 개별 파일 다운로드 
for(idx =  7750 ; idx > 7630; idx--) {    // 7724(20190501) 7718(20190424) 7712(20190417) 7700(20190402) 7689(20190319) // 7683 // 7665(2019.02.20)
  (function(idx1) {
    prom = prom.then(function() {
    return rp(url + idx1)
      .then(function(html){
        //success!
        //console.log(html);
        console.log("connected + " + idx1);
        var title = $('.tit_view > dd', html).text();
        var date = $('.info_view2 > dd:nth-of-type(2n)', html).text();
        date = date.substring(4,10) + ', ' + date.substring(24) ;
        date1 = new Date(Date.parse(date));
        var pdf_url = 'http://www.itfind.or.kr'+ $('.file_view > dd > a', html)[0].attribs.href;
        var content = $('.view_cont > dl', html).text().replace(/    /gi,'').replace(/원문 바로가기|원문정보/gi, '');
        content = content.replace(/\n\n\n\n/gi,'\n');

        var tmpResolve = null;
        var subPromise = new Promise(function(resolve, reject) {
          tmpResolve = resolve;
        });
        var filename = date1.yyyymmdd() + "_" + title.replace(/[\/]/gi,'') + '.pdf';
        var path = destPath + '주간기술동향_pdf/' + filename;

        if( !fs.existsSync(path) ) {
          download(pdf_url, {filename:filename},function(err){
            if (err) console.log("errored " + filename);
            fs.renameSync(filename, path);
            console.log("downloaded [" + idx1 + "] : " + path);
            tmpResolve();
          });
          var msg = date1.yyyymmdd() + "\t" + title + '\t""\t""\t""\t""\t' + pdf_url + '\n';
          fs.appendFileSync('주간기술동향_제목_link.txt', msg, 'utf8');
        } else {
          console.log("already exist [" + idx1 + "] : " + path);
          tmpResolve();
        }

        return subPromise;
      })
      .catch(function(err){
        //handle error
      });
    });
  })(idx);
}
