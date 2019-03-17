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

var msgArr = [];
var msgArr1 = [];
var privDate = 0;
var idx = 1061;
var prom = Promise.resolve();

// 7654 : 2019년 2월 1일   5G와 자율차동차로 촉발될 미디어의 미래 먹거리 기회
// 7631 : 2019년 1월 15일     VR · AR · MR 관련 기술 및 정책 동향

// 1063 : 2019년 2월 6일 1882호
// 1060 : 2019년 1월 16일 1879호
// 1059 : 2018년 12월 26일 1878호

var iii = 1068; // 주단위 목록 최종 번호

//for(idx =  7649 ; idx > 1062; idx--) {  // 7648 // 7665(2019.02.20)
//for(idx =  7700 ; idx > 7630; idx--) {    // 7683
//for(idx =  1062 ; idx > 0; idx--) {
for(idx =  iii ; idx > 1059; idx--) {
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
//1061
        if( idx1 > iii) {
            download(pdf_url, {filename:'주간기술동향_pdf/' + date1.yyyymmdd() + "_" + title.replace(/[\/]/gi,'') + '.pdf'},function(err){
                if (err) console.log("errored " + date1.yyyymmdd() + "_" + title.replace(/[\/]/gi,'') + '.pdf');
                console.log("downloaded [" + idx1 + "] : " + date1.yyyymmdd() + "_" + title.replace(/[\/]/gi,'') + '.pdf');
                tmpResolve();
            });
        } else {
          download(pdf_url, {filename:'주간기술동향_pdf(주간)/' + date1.yyyymmdd() + "_" + title.replace(/[\/]/gi,'') + '.pdf'},function(err){
              if (err) console.log("errored " + date1.yyyymmdd() + "_" + title.replace(/[\/]/gi,'') + '.pdf');
              console.log("downloaded [" + idx1 + "] : " + date1.yyyymmdd() + "_" + title.replace(/[\/]/gi,'') + '.pdf');
              tmpResolve();
          });
        }
        // tmpResolve();  // 다운로드 주석 처리시 활성화 필요

        if( idx1 > iii) {
          var msg = date1.yyyymmdd() + "\t" + title + '\t' + pdf_url + '\n';
          var msg1 = date1.yyyymmdd() + "\t" + title + '\n';
          if( privDate != date1.yyyymmdd()) {
            if(msgArr.length > 0) {
              fs.appendFileSync('주간기술동향_제목_link.txt', msgArr.join(''), 'utf8');
              msgArr = [];
              fs.appendFileSync('주간기술동향_제목.txt', msgArr1.join(''), 'utf8');
              msgArr1 = [];
              console.log("flush " + privDate);
            }
            privDate = date1.yyyymmdd();
          }
          msgArr.unshift(msg);
          msgArr1.unshift(msg1);
          console.log( msg );
        } else {
          var msg = title + '  ' + date1.yyyymmdd() + "\n=============================\n\n" + content.trim() + "\n\n" + pdf_url + "\n\n" + url + idx1 + "\n\n";
          fs.writeFileSync('주간기술동향_요약/' + date1.yyyymmdd() + "_" + title.replace('/','') + '.txt', msg, 'utf8');
          fs.appendFileSync('주간기술동향_요약(통합)/' + date1.getFullYear() + '년_주간기술동향.txt', msg, 'utf8');
          fs.appendFileSync('주간기술동향_요약(통합)/전제_주간기술동향.txt', msg, 'utf8');

          var msg1 = title + '  ' + date1.yyyymmdd1() + "\n\n" + content.trim() + "\n\n";
          fs.appendFileSync('주간기술동향_요약(통합)/' + date1.getFullYear() + '년_주간기술동향_TTS.txt', msg1, 'utf8');

        }
//        console.log(msg);

        return subPromise;

/*
        console.log(title + '  ' + date1.yyyymmdd());
        console.log(content.trim());
        console.log(pdf_url);
        console.log(url + idx1);
*/

      })
      .catch(function(err){
        //handle error
      });
    });
  })(idx);
}
