/**
 * Created by jiangzg on 2017/8/7.
 */

function createId() {
  return 'id-'+(Math.random().toString().replace('.',''));
}

var tpl = `<div v-if="showModal" class="spread-wrap" data-front>
        <div ref="spread-download" class="spread">
            <div class="spread-header" contenteditable="true">每日大牌折扣</div>
            <div class="spread-body">
                <div class="spread-flage" v-if="spread.discount">
                    <img src="${My$.pluginsPath}images/i-discount.png">
                    <div class="spread-discount">{{ spread.discount }}折</div>
                </div>
                <img :src="spread.cover"
                    @mousedown.stop.prevent="mousedown"
                    @mousemove.stop.prevent="mousemove"
                    @mouseup.stop.prevent="mouseup"
                    @mouseout.stop.prevent="mouseout"
                    ref="spread-cover"
                />
            </div>
            <div class="spread-desc">
                <div class="spread-tedian">
                    <span class="spread-red" contenteditable="true">产品特点：</span><span contenteditable="true">{{ spread.desc?spread.desc:spread.title }}</span>
                </div>
                <div class="spread-erweima">
                    <div class="spread-bottom-left">
                        <img :src="erweima">
                        <div contenteditable="true">长按二维码立即下单</div>
                    </div>
                    <div class="spread-bottom-right">
                        <div class="spread-title" contenteditable="true">{{ spread.title }}</div>
                        <div class="spread-price">
                            <span class="spread-red" contenteditable="true"><template v-if="spread.price">现价:{{ spread.price }}元</template></span>
                            <span class="spread-gray" contenteditable="true"><template v-if="spread.mark_price">原价:{{ spread.mark_price }}元</template></span>
                        </div>
                        <div class="spread-logo">
                            <img :src="spread.logo">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div>
          <div @click="downLoad" class="spread-download-png">下载</div>
          <div @click="downLoadWindowClose" class="spread-download-png spread-download-close">关闭</div>
        </div>
    </div>`;

var id = createId();

$('body').append('<div id="'+id+'">'+tpl+'</div>');
var app = new Vue({
  el: '#'+id,
  data: {
    showModal:false,
    spread:{},
    link_next_data:{},
    triggerObj:null,
    app:$('#'+id),
    url:'',
    mouse:{},
    moveImg:null,
  },
  computed:{
    erweima:function () {
      this.app.qrcode({
        width:"106",
        height:"106",
        text:this.url
      });
      var imgData = this.app.find('canvas')[0].toDataURL("image/png",1);
      this.app.find('canvas').remove();
      return imgData;
    }
  },
  methods:{
    showModelSpread(id,item){
      this.showModal = true;
      this.spread = item;
      if( !this.spread.cover ){
        this.spread.cover = this.spread.pic?this.spread.pic[0]:'';
      }
      if( !this.spread.discount && this.spread.mark_price && this.spread.price ){
        this.spread.discount = Number(this.spread.price / this.spread.mark_price * 10).toFixed(1);
      }else if(!this.spread.discount){
        this.spread.discount = 0;
      }
      if( this.spread.discount<=0 || this.spread.discount>=10 ){
        this.spread.discount = 0;
      }

      this.url = this.spread.url;

      var promise = new Promise((resolve, reject)=>{
        chrome.runtime.sendMessage({
          type:'get-check-cps',
          url:this.url
        });
        window.bindMessage['get-check-cps-replay'] = resolve;

      }).then( replayDate =>{

        if(this.url==replayDate || !replayDate){
          this.noCps = 'no-cps';
        }else{
          this.noCps = 'ok-cps';
          this.url = replayDate;
        }

        return new Promise((resolve, reject)=>{

          var pic = {
            type:5,
            caption:'每日大牌折扣',
            url:this.spread.url,
            title:this.spread.title,
            price:this.spread.price,
            price2:this.spread.mark_price,
            description:'',
            cover:this.spread.cover,
            'cover-mall':this.spread.logo
          };

          chrome.runtime.sendMessage({
            type:'get-save-card-data',
            pic:pic,
            discount:this.spread.discount
          });

          window.bindMessage['get-save-card-data-replay'] = resolve;

        });
      }).then( replayDate =>{
        if(replayDate.status==0){
          this.url = replayDate.short_url;
        }
      });

    },
    downLoadWindowClose(){
      this.showModal = false;
    },
    downLoad(){
      //触发截图
      chrome.runtime.sendMessage({
        type:'get-bcActiveTab',
        data:this.link_next_data,
        info:{
          offsetLeft: $(app.$refs['spread-download']).offset().left,
          offsetTop: $(app.$refs['spread-download']).offset().top,
          height: $(app.$refs['spread-download']).height(),
          width: $(app.$refs['spread-download']).width(),
          scrollTop:$(window).scrollTop(),
          scrollLeft:$(window).scrollLeft()
        }
      }, response => {
        if( this.triggerObj ){
          if(response.result=='ok'){
            this.triggerObj.addClass('my-spider-link-success').html('传播图生成成功');
            this.showModal = false;
          }else{
            this.triggerObj.addClass('my-spider-link-error').html('传播图生成失败');
          }
        }
      });
    },

    mousedown(e){
      this.moveImg = this.moveImg?this.moveImg:$(this.$refs['spread-cover']);

      this.mouse.lock = true;
      this.mouse.start_x = e.clientX;
      this.mouse.start_y = e.clientY;
      this.mouse.start_mgt = parseInt( this.moveImg.css('top') );
    },
    mousemove(e){
      if(this.mouse.lock){
        this.mouse.end_x = e.clientX;
        this.mouse.end_y = e.clientY;

        this.mouse.move_x = this.mouse.start_x - this.mouse.end_x;
        this.mouse.move_y = this.mouse.start_y - this.mouse.end_y;
        console.log( this.mouse.start_mgt ,-this.mouse.move_y );
        this.moveImg.css('top', this.mouse.start_mgt - this.mouse.move_y );
      }
    },
    mouseup(e){
      this.mouse.lock = false;
      this.mouse.end_x = e.clientX;
      this.mouse.end_y = e.clientY;
    },
    mouseout(e){
      this.mouseup(e);
    }
  }
});


(function () {
    var $ = My$;

    var loadHuihui = function (box,url,timesLong) {
        //加载慧慧的价格数据
        var t = '1502792232600';
        var callbackName = 'youdaogouwupi'+t;
        //注册回调函数
        window[callbackName] = function (json) {
            box.data('huihui-json',json);
            box.attr('data-huihui-json','ok').find('.my-spider-loading-huihui-data').remove();
        };
        box.append('<span class="my-spider-loading-huihui-data">加载中...</span>');
        $.ajax({
            url: "https://zhushou.huihui.cn/productSense",
            type: 'GET',
            data: {
                jsonp:callbackName,
                phu:url,
                type:'canvas',
                t:t
            },
            cache: false,
            dataType: 'html',
            success: function (replatData) {
                eval(replatData);
            },
            error:function () {
                box.find('.my-spider-loading-huihui-data').remove();
                box.removeAttr('data-huihui-json');
            }
        });
    };

    $('body').on('mouseenter','a[href]',function () {
        if( $(this).data('already-wrap-box') ){
            $(this).data('already-wrap-box').find('.my-spider-link-next').show();
            return;
        }

        var url = $(this).attr('href');
        url = url.substr(0,2)=='//'?'http:'+url:url;

        if( $(this).data('already-mark') || !url ) return;
        var result = $.parseUrl(url);
        if(!result.host) return;
        var _this = $(this), box = null;

        URL_CONFIG.forEach(function(item, index){
            if(item.host.toLocaleLowerCase()==result.host.toLocaleLowerCase()){
                box = item.hasInsertDom(_this);
                _this.data('already-wrap-box',box);

                if( box ){

                    if( box.attr('data-huihui-json')!='ok'){
                        loadHuihui(box,url,1);
                    }
                    var pos = box.css('position');
                    if(pos!='fixed' && pos!='relative' && pos!='absolute'){
                        box.css('position','relative');
                    }
                    box.addClass('my-spider-link-wrap');
                    box.append('<span class="my-spider-link-next">采集</span>');
                    box.append('<span class="my-spider-spread-image">生成传播图</span>');
                    _this.data('already-mark','ok');
                    var _span = box.find('.my-spider-link-next');
                    _span.data('already-item',item);
                    _span.data('already-wrap-box',box);
                    return false;
                }
            }
        });
    }).on('click','.my-spider-link-next',function (e,resolve,reject) {
        var _this = $(this);
        if( _this.hasClass('my-spider-link-already') ) return;
        var config_item = _this.data('already-item');
        var item_data = config_item.getItemData( _this.data('already-wrap-box') );
        item_data.logo = config_item.logo;

        if( item_data.url && item_data.url.substr(0,2)=='//' ){
            item_data.url = 'http:'+item_data.url;
        }

        var box = _this.data('already-wrap-box');
        var huihui_json = box.data('huihui-json') || {};
        
        if(!item_data.price) item_data.price = huihui_json.today || huihui_json.min;
        if(!item_data.mark_price) item_data.mark_price = huihui_json.max;

        item_data.price = $.priceFn(item_data.price);
        item_data.mark_price = $.priceFn(item_data.mark_price);

        item_data.mall = config_item.mall;
        item_data.shop = config_item.shop;
        if(item_data.price && item_data.mark_price && item_data.price!=item_data.mark_price && item_data.price<item_data.mark_price){
            item_data.discount = Number( item_data.price / item_data.mark_price * 10 ).toFixed(1);
        }

        item_data.pic = item_data.pic.map(function (item) {
            return $.extendUrl(item);
        });

        _this.data('already-catch-data',item_data);

        chrome.runtime.sendMessage({
            type:'get-item-html',
            data:item_data
        }, function(response){
            if(response.result=='ok'){
                _this.addClass('my-spider-link-success').html('已采集');
                resolve(item_data);
            }else{
                _this.addClass('my-spider-link-error').html('采集失败');
              reject('采集失败');
            }
        });
    }).on('click','.my-spider-spread-image',function () {
        //生成传播图
      var _this = $(this);
      var promise = new Promise(function(resolve, reject) {
        resolve();
      });
      app.triggerObj = _this;

      var link_next,link_next_data;

      link_next = _this.parent().find('.my-spider-link-next');

      promise.then(()=>{
        return new Promise((resolve, reject)=>{
          link_next.trigger('click',[resolve, reject]);
        });
      }).then(()=>{

        link_next_data = link_next.data('already-catch-data');
        app.link_next_data = link_next_data;
        app.url = link_next_data.url;

        return new Promise((resolve, reject)=>{
          app.showModal = true;
          app.showModelSpread(null,link_next_data);
          app.showModal = true;
          resolve();
        });

      });

    });

})();





window.bindMessage = {};

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){

  if(message.type=='get-check-cps-replay'){

    window.bindMessage && window.bindMessage[message.type] && window.bindMessage[message.type](message.data);

  }else if(message.type=='get-save-card-data-replay'){

    window.bindMessage && window.bindMessage[message.type] && window.bindMessage[message.type](message.data);

  }

});









