/*! docxtemplater-image-module-free 1.1.1 | MIT | dibundel ulang untuk browser (lihat tools/build-image-module.js) */
"use strict";var ImageModule=(()=>{var p=(r,n)=>()=>(n||r((n={exports:{}}).exports,n),n.exports);var y=p((j,v)=>{"use strict";v.exports={getImageXml:function(n,t){return(`<w:drawing>
		<wp:inline distT="0" distB="0" distL="0" distR="0">
			<wp:extent cx="`+t[0]+'" cy="'+t[1]+`"/>
			<wp:effectExtent l="0" t="0" r="0" b="0"/>
			<wp:docPr id="2" name="Image 2" descr="image"/>
			<wp:cNvGraphicFramePr>
				<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
			</wp:cNvGraphicFramePr>
			<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
				<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
					<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
						<pic:nvPicPr>
							<pic:cNvPr id="0" name="Picture 1" descr="image"/>
							<pic:cNvPicPr>
								<a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>
							</pic:cNvPicPr>
						</pic:nvPicPr>
						<pic:blipFill>
							<a:blip r:embed="rId`+n+`">
								<a:extLst>
									<a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}">
										<a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/>
									</a:ext>
								</a:extLst>
							</a:blip>
							<a:srcRect/>
							<a:stretch>
								<a:fillRect/>
							</a:stretch>
						</pic:blipFill>
						<pic:spPr bwMode="auto">
							<a:xfrm>
								<a:off x="0" y="0"/>
								<a:ext cx="`+t[0]+'" cy="'+t[1]+`"/>
							</a:xfrm>
							<a:prstGeom prst="rect">
								<a:avLst/>
							</a:prstGeom>
							<a:noFill/>
							<a:ln>
								<a:noFill/>
							</a:ln>
						</pic:spPr>
					</pic:pic>
				</a:graphicData>
			</a:graphic>
		</wp:inline>
	</w:drawing>
		`).replace(/\t|\n/g,"")},getImageXmlCentered:function(n,t){return(`<w:p>
			<w:pPr>
				<w:jc w:val="center"/>
			</w:pPr>
			<w:r>
				<w:rPr/>
				<w:drawing>
					<wp:inline distT="0" distB="0" distL="0" distR="0">
					<wp:extent cx="`+t[0]+'" cy="'+t[1]+`"/>
					<wp:docPr id="0" name="Picture" descr=""/>
					<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
						<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
						<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
							<pic:nvPicPr>
							<pic:cNvPr id="0" name="Picture" descr=""/>
							<pic:cNvPicPr>
								<a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>
							</pic:cNvPicPr>
							</pic:nvPicPr>
							<pic:blipFill>
							<a:blip r:embed="rId`+n+`"/>
							<a:stretch>
								<a:fillRect/>
							</a:stretch>
							</pic:blipFill>
							<pic:spPr bwMode="auto">
							<a:xfrm>
								<a:off x="0" y="0"/>
								<a:ext cx="`+t[0]+'" cy="'+t[1]+`"/>
							</a:xfrm>
							<a:prstGeom prst="rect">
								<a:avLst/>
							</a:prstGeom>
							<a:noFill/>
							<a:ln w="9525">
								<a:noFill/>
								<a:miter lim="800000"/>
								<a:headEnd/>
								<a:tailEnd/>
							</a:ln>
							</pic:spPr>
						</pic:pic>
						</a:graphicData>
					</a:graphic>
					</wp:inline>
				</w:drawing>
			</w:r>
		</w:p>
		`).replace(/\t|\n/g,"")},getPptxImageXml:function(n,t,a){return(`<p:pic>
			<p:nvPicPr>
				<p:cNvPr id="6" name="Picture 2"/>
				<p:cNvPicPr>
					<a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>
				</p:cNvPicPr>
				<p:nvPr/>
			</p:nvPicPr>
			<p:blipFill>
				<a:blip r:embed="rId`+n+`" cstate="print">
					<a:extLst>
						<a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}">
							<a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/>
						</a:ext>
					</a:extLst>
				</a:blip>
				<a:srcRect/>
				<a:stretch>
					<a:fillRect/>
				</a:stretch>
			</p:blipFill>
			<p:spPr bwMode="auto">
				<a:xfrm>
					<a:off x="`+a.x+'" y="'+a.y+`"/>
					<a:ext cx="`+t[0]+'" cy="'+t[1]+`"/>
				</a:xfrm>
				<a:prstGeom prst="rect">
					<a:avLst/>
				</a:prstGeom>
				<a:noFill/>
				<a:ln>
					<a:noFill/>
				</a:ln>
				<a:effectLst/>
				<a:extLst>
					<a:ext uri="{909E8E84-426E-40DD-AFC4-6F175D3DCCD1}">
						<a14:hiddenFill xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main">
							<a:solidFill>
								<a:schemeClr val="accent1"/>
							</a:solidFill>
						</a14:hiddenFill>
					</a:ext>
					<a:ext uri="{91240B29-F687-4F45-9708-019B960494DF}">
						<a14:hiddenLine xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" w="9525">
							<a:solidFill>
								<a:schemeClr val="tx1"/>
							</a:solidFill>
							<a:miter lim="800000"/>
							<a:headEnd/>
							<a:tailEnd/>
						</a14:hiddenLine>
					</a:ext>
					<a:ext uri="{AF507438-7753-43E0-B8FC-AC1667EBCBE1}">
						<a14:hiddenEffects xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main">
							<a:effectLst>
								<a:outerShdw dist="35921" dir="2700000" algn="ctr" rotWithShape="0">
									<a:schemeClr val="bg2"/>
								</a:outerShdw>
							</a:effectLst>
						</a14:hiddenEffects>
					</a:ext>
				</a:extLst>
			</p:spPr>
		</p:pic>
		`).replace(/\t|\n/g,"")}}});var d=p((V,P)=>{P.exports=window.docxtemplater});var b=p((Y,I)=>{function w(){}w.prototype.parseFromString=function(r,n){return new window.DOMParser().parseFromString(r,n||"text/xml")};I.exports={DOMParser:w,XMLSerializer:window.XMLSerializer}});var E=p((W,N)=>{"use strict";var R=d().DocUtils;R.convertPixelsToEmus=function(r){return Math.round(r*9525)};N.exports=R});var D=p((Z,T)=>{"use strict";var L=function(){function r(n,t){for(var a=0;a<t.length;a++){var e=t[a];e.enumerable=e.enumerable||!1,e.configurable=!0,"value"in e&&(e.writable=!0),Object.defineProperty(n,e.key,e)}}return function(n,t,a){return t&&r(n.prototype,t),a&&r(n,a),n}}();function k(r,n){if(!(r instanceof n))throw new TypeError("Cannot call a class as a function")}var F=E(),M=/[^.]+\.([^.]+)/,f={getPrefix:function(n){return n==="docx"?"word":"ppt"},getFileTypeName:function(n){return n==="docx"?"document":"presentation"},getRelsFileName:function(n){return n.replace(/^.*?([a-zA-Z0-9]+)\.xml$/,"$1")+".xml.rels"},getRelsFilePath:function(n,t){var a=f.getRelsFileName(n),e=t==="pptx"?"ppt/slides":"word";return e+"/_rels/"+a}};T.exports=function(){function r(n,t,a,e){k(this,r),this.fileName=t,this.prefix=f.getPrefix(e),this.zip=n,this.xmlDocuments=a,this.fileTypeName=f.getFileTypeName(e),this.mediaPrefix=e==="pptx"?"../media":"media";var s=f.getRelsFilePath(t,e);this.relsDoc=a[s]||this.createEmptyRelsDoc(a,s)}return L(r,[{key:"createEmptyRelsDoc",value:function(t,a){var e=this.prefix+"/_rels/"+this.fileTypeName+".xml.rels",s=t[e];if(!s){var l=new Error("Could not copy from empty relsdoc");throw l.properties={mainRels:e,relsFileName:a,files:Object.keys(this.zip.files)},l}for(var i=F.str2xml(F.xml2str(s)),o=i.getElementsByTagName("Relationships")[0],c=o.getElementsByTagName("Relationship"),m=0,u=c.length;m<u;m++)o.removeChild(c[m]);return t[a]=i,i}},{key:"loadImageRels",value:function(){var t=this.relsDoc.getElementsByTagName("Relationship");return Array.prototype.reduce.call(t,function(a,e){var s=e.getAttribute("Id");return/^rId[0-9]+$/.test(s)?Math.max(a,parseInt(s.substr(3),10)):a},0)}},{key:"addExtensionRels",value:function(t,a){var e=this.xmlDocuments["[Content_Types].xml"],s=e.getElementsByTagName("Default"),l=Array.prototype.some.call(s,function(c){return c.getAttribute("Extension")===a});if(!l){var i=e.getElementsByTagName("Types")[0],o=e.createElementNS(e.documentElement.namespaceURI,"Default");o.setAttribute("ContentType",t),o.setAttribute("Extension",a),i.appendChild(o)}}},{key:"addImageRels",value:function(t,a,e){e==null&&(e=0);var s=e===0?t:t+("("+e+")"),l=this.prefix+"/media/"+s;if(this.zip.files[l]!=null)return this.addImageRels(t,a,e+1);var i={name:l,data:a,options:{binary:!0}};this.zip.file(i.name,i.data,i.options);var o=s.replace(M,"$1");this.addExtensionRels("image/"+o,o);var c=this.relsDoc.getElementsByTagName("Relationships")[0],m=this.relsDoc.createElementNS(this.relsDoc.documentElement.namespaceURI,"Relationship"),u=this.loadImageRels()+1;return m.setAttribute("Id","rId"+u),m.setAttribute("Type","http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"),m.setAttribute("Target",this.mediaPrefix+"/"+s),c.appendChild(m),u}}]),r}()});var q=p((J,A)=>{var S=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(r){return typeof r}:function(r){return r&&typeof Symbol=="function"&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r},B=function(){function r(n,t){for(var a=0;a<t.length;a++){var e=t[a];e.enumerable=e.enumerable||!1,e.configurable=!0,"value"in e&&(e.writable=!0),Object.defineProperty(n,e.key,e)}}return function(n,t,a){return t&&r(n.prototype,t),a&&r(n,a),n}}();function z(r,n){if(!(r instanceof n))throw new TypeError("Cannot call a class as a function")}var h=y(),x=d().DocUtils,X=b().DOMParser;function _(r){return r!==r}var C=D(),g="open-xml-templating/docxtemplater-image-module";function G(r){var n=r.part;return n}function O(r){var n=r.part,t=r.left,a=r.right,e=r.postparsed,s=e.slice(t+1,a).reduce(function(c,m){return c+m.value},""),l=new X().parseFromString("<xml>"+s+"</xml>");n.offset={x:0,y:0},n.ext={cx:0,cy:0};var i=l.getElementsByTagName("a:off"),o=l.getElementsByTagName("a:ext");return o.length>0&&(n.ext.cx=parseInt(o[o.length-1].getAttribute("cx"),10),n.ext.cy=parseInt(o[o.length-1].getAttribute("cy"),10)),i.length>0&&(n.offset.x=parseInt(i[i.length-1].getAttribute("x"),10),n.offset.y=parseInt(i[i.length-1].getAttribute("y"),10)),n}var U=function(){function r(n){if(z(this,r),this.name="ImageModule",this.options=n||{},this.imgManagers={},this.options.centered==null&&(this.options.centered=!1),this.options.getImage==null)throw new Error("You should pass getImage");if(this.options.getSize==null)throw new Error("You should pass getSize");this.imageNumber=1}return B(r,[{key:"optionsTransformer",value:function(t,a){var e=a.zip.file(/\.xml\.rels/).concat(a.zip.file(/\[Content_Types\].xml/)).map(function(s){return s.name});return this.fileTypeConfig=a.fileTypeConfig,this.fileType=a.fileType,this.zip=a.zip,t.xmlFileNames=t.xmlFileNames.concat(e),t}},{key:"set",value:function(t){t.zip&&(this.zip=t.zip),t.xmlDocuments&&(this.xmlDocuments=t.xmlDocuments)}},{key:"parse",value:function(t){var a=g,e="placeholder";return this.options.setParser?this.options.setParser(t):t.substring(0,2)==="%%"?{type:e,value:t.substr(2),module:a,centered:!0}:t.substring(0,1)==="%"?{type:e,value:t.substr(1),module:a,centered:!1}:null}},{key:"postparse",value:function(t){var a=void 0,e=void 0;return this.fileType==="pptx"?(a="p:sp",e=O):(a=this.options.centered?"w:p":"w:t",e=G),x.traits.expandToOne(t,{moduleName:g,getInner:e,expandTo:a})}},{key:"render",value:function(t,a){if(!t.type==="placeholder"||t.module!==g)return null;var e=a.scopeManager.getValue(t.value,{part:t});if(e){if((typeof e=="undefined"?"undefined":S(e))==="object")return this.getRenderedPart(t,e.rId,e.sizePixel)}else return{value:this.fileTypeConfig.tagTextXml};var s=new C(this.zip,a.filePath,this.xmlDocuments,this.fileType),l=this.options.getImage(e,t.value),i=s.addImageRels(this.getNextImageName(),l),o=this.options.getSize(l,e,t.value);return this.getRenderedPart(t,i,o)}},{key:"resolve",value:function(t,a){var e=this,s=new C(this.zip,a.filePath,this.xmlDocuments,this.fileType);if(!t.type==="placeholder"||t.module!==g)return null;var l=a.scopeManager.getValue(t.value,{part:t});return l?new Promise(function(i){var o=e.options.getImage(l,t.value);i(o)}).then(function(i){var o=s.addImageRels(e.getNextImageName(),i);return new Promise(function(c){var m=e.options.getSize(i,l,t.value);c(m)}).then(function(c){return{rId:o,sizePixel:c}})}):{value:this.fileTypeConfig.tagTextXml}}},{key:"getRenderedPart",value:function(t,a,e){if(_(a))throw new Error("rId is NaN, aborting");var s=[x.convertPixelsToEmus(e[0]),x.convertPixelsToEmus(e[1])],l=this.options.centered||t.centered,i=void 0;return this.fileType==="pptx"?i=this.getRenderedPartPptx(t,a,s,l):i=this.getRenderedPartDocx(a,s,l),{value:i}}},{key:"getRenderedPartPptx",value:function(t,a,e,s){var l={x:parseInt(t.offset.x,10),y:parseInt(t.offset.y,10)},i=parseInt(t.ext.cx,10)||1,o=parseInt(t.ext.cy,10)||1,c=parseInt(e[0],10)||1,m=parseInt(e[1],10)||1;return s&&(l.x=Math.round(l.x+i/2-c/2),l.y=Math.round(l.y+o/2-m/2)),h.getPptxImageXml(a,[c,m],l)}},{key:"getRenderedPartDocx",value:function(t,a,e){return e?h.getImageXmlCentered(t,a):h.getImageXml(t,a)}},{key:"getNextImageName",value:function(){var t="image_generated_"+this.imageNumber+".jpeg";return this.imageNumber++,t}}]),r}();A.exports=U});return q();})();
ImageModule = ImageModule.default || ImageModule;
