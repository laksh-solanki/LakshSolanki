<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import interact from 'interactjs';

const file = ref(null);
const fileName = ref('');
const isProcessing = ref(false);

const presentationXmlDoc = ref(null);
const slideXmlDocs = ref({});
const slidesData = ref([]);
const activeSlideIndex = ref(0);
const activeElement = ref(null);

const CANVAS_WIDTH = 800;
const canvasHeight = ref(450);
const emuScale = ref(1);
const canvasScale = ref(1);

const updateScale = () => {
  const wrapper = document.querySelector('.editor-layout');
  if (wrapper) {
    const availableWidth = wrapper.clientWidth - 32; // 16px padding on sides
    if (availableWidth < CANVAS_WIDTH) {
      canvasScale.value = availableWidth / CANVAS_WIDTH;
    } else {
      canvasScale.value = 1;
    }
  }
};

const loadRels = async (zip, relsPath) => {
  const relMap = {};
  if (zip.files[relsPath]) {
    const relsContent = await zip.file(relsPath).async('string');
    const parser = new DOMParser();
    const relsDoc = parser.parseFromString(relsContent, 'text/xml');
    const rels = relsDoc.getElementsByTagName('Relationship');
    for (let r = 0; r < rels.length; r++) {
      relMap[rels[r].getAttribute('Id')] = rels[r].getAttribute('Target');
    }
  }
  return relMap;
};

const extractImages = async (xmlDoc, relMap, zip, canvasW, canvasH, emuScaleVal, startingZIndex, isLockedGroup) => {
  const images = [];
  let zIdx = startingZIndex;

  const extractFromNode = async (node, rIdAttribute) => {
    let rId = node.getAttribute(rIdAttribute);
    if (!rId) rId = node.getAttribute(rIdAttribute.replace('r:', ''));
    if (!rId || !relMap[rId]) return null;

    const targetRaw = relMap[rId];
    let mediaFilename = targetRaw.split('/').pop();
    mediaFilename = decodeURIComponent(mediaFilename);

    const zipKeys = Object.keys(zip.files);
    let matchedPath = zipKeys.find(k => k.toLowerCase().endsWith('/' + mediaFilename.toLowerCase()));
    if (!matchedPath) matchedPath = zipKeys.find(k => k.toLowerCase() === mediaFilename.toLowerCase());

    if (!matchedPath || !zip.files[matchedPath]) return null;

    try {
      const base64 = await zip.files[matchedPath].async('base64');
      const ext = mediaFilename.split('.').pop().toLowerCase();
      let mime = 'image/jpeg';
      if (ext === 'png') mime = 'image/png';
      else if (ext === 'svg') mime = 'image/svg+xml';
      else if (ext === 'gif') mime = 'image/gif';

      let pNode = node.parentNode;
      let xfrm = null;

      while (pNode && pNode.nodeName !== 'p:sp' && pNode.nodeName !== 'p:pic' && pNode.nodeName !== 'p:bg') {
        pNode = pNode.parentNode;
      }

      let x = 0, y = 0, w = canvasW, h = canvasH, rotation = 0;
      let isBg = false;

      if (pNode) {
        if (pNode.nodeName === 'p:bg') {
          isBg = true;
        } else {
          xfrm = pNode.getElementsByTagName('a:xfrm')[0];
          if (!xfrm) xfrm = pNode.getElementsByTagName('xfrm')[0];
          if (xfrm) {
            let off = xfrm.getElementsByTagName('a:off')[0];
            if (!off) off = xfrm.getElementsByTagName('off')[0];
            let extNode = xfrm.getElementsByTagName('a:ext')[0];
            if (!extNode) extNode = xfrm.getElementsByTagName('ext')[0];
            let rotAttr = xfrm.getAttribute('rot');
            if (rotAttr) rotation = parseInt(rotAttr, 10) / 60000;

            if (off) {
              x = parseInt(off.getAttribute('x') || '0', 10) / emuScaleVal;
              y = parseInt(off.getAttribute('y') || '0', 10) / emuScaleVal;
            }
            if (extNode) {
              w = parseInt(extNode.getAttribute('cx') || '0', 10) / emuScaleVal;
              h = parseInt(extNode.getAttribute('cy') || '0', 10) / emuScaleVal;
            }
          }
        }
      }

      return {
        type: (isBg || isLockedGroup) ? 'bg' : 'image',
        dataUrl: `data:${mime};base64,${base64}`,
        x, y, w, h, rotation,
        originalShapeNode: pNode
      };
    } catch (e) {
      console.error('Extraction failed', e);
      return null;
    }
  };

  const blips = Array.from(new Set([
    ...Array.from(xmlDoc.getElementsByTagName('a:blip')),
    ...Array.from(xmlDoc.getElementsByTagName('blip')),
    ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'blip'))
  ]));
  for (let i = 0; i < blips.length; i++) {
    const imgData = await extractFromNode(blips[i], 'r:embed');
    if (imgData) images.push({ ...imgData, id: `img_${zIdx}`, zIndex: zIdx++ });
  }

  const vImages = Array.from(new Set([
    ...Array.from(xmlDoc.getElementsByTagName('v:imagedata')),
    ...Array.from(xmlDoc.getElementsByTagName('imagedata')),
    ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'imagedata'))
  ]));
  for (let i = 0; i < vImages.length; i++) {
    const imgData = await extractFromNode(vImages[i], 'r:id');
    if (imgData) images.push({ ...imgData, id: `img_${zIdx}`, zIndex: zIdx++ });
  }

  return { images, nextZIndex: zIdx };
};

const extractBgColor = (xmlDoc) => {
  const bg = xmlDoc.getElementsByTagName('p:bg')[0] || xmlDoc.getElementsByTagNameNS('*', 'bg')[0];
  if (bg) {
    const solidFill = bg.getElementsByTagName('a:solidFill')[0] || bg.getElementsByTagNameNS('*', 'solidFill')[0];
    if (solidFill) {
      const srgbClr = solidFill.getElementsByTagName('a:srgbClr')[0] || solidFill.getElementsByTagNameNS('*', 'srgbClr')[0];
      if (srgbClr && srgbClr.getAttribute('val')) {
        return '#' + srgbClr.getAttribute('val');
      }
    }
  }
  return null;
};

const handleFileUpload = async (event) => {
  const selectedFile = event.target.files[0];
  if (!selectedFile) return;

  isProcessing.value = true;
  fileName.value = selectedFile.name;
  file.value = selectedFile;
  slidesData.value = [];
  activeElement.value = null;

  try {
    const zip = await JSZip.loadAsync(selectedFile);

    if (zip.files['ppt/presentation.xml']) {
      const presContent = await zip.file('ppt/presentation.xml').async('string');
      const parser = new DOMParser();
      presentationXmlDoc.value = parser.parseFromString(presContent, 'text/xml');
      const sldSz = presentationXmlDoc.value.getElementsByTagName('p:sldSz')[0];
      if (sldSz) {
        const cx = parseInt(sldSz.getAttribute('cx') || '9144000', 10);
        const cy = parseInt(sldSz.getAttribute('cy') || '5143500', 10);
        emuScale.value = cx / CANVAS_WIDTH;
        canvasHeight.value = CANVAS_WIDTH * (cy / cx);
      }
    }

    const slideFiles = Object.keys(zip.files).filter(n => n.match(/^ppt\/slides\/slide\d+\.xml$/));
    slideFiles.sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));

    const parsedSlides = [];
    const newSlideXmlDocs = {};

    for (const slideFileName of slideFiles) {
      const slideNumberMatch = slideFileName.match(/\d+/);
      const slideNumber = slideNumberMatch ? slideNumberMatch[0] : '1';

      const xmlContent = await zip.file(slideFileName).async('string');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      newSlideXmlDocs[slideFileName] = xmlDoc;

      const slideRelsPath = slideFileName.replace('slides/', 'slides/_rels/') + '.rels';
      const slideRelMap = await loadRels(zip, slideRelsPath);

      let allItems = [];
      let currentZIndex = 0;
      let slideBgColor = '#ffffff';

      const slideLayoutTarget = Object.values(slideRelMap).find(t => t.includes('slideLayout'));
      if (slideLayoutTarget) {
        const layoutFileName = decodeURIComponent(slideLayoutTarget.split('/').pop());
        const layoutPath = Object.keys(zip.files).find(k => k.toLowerCase().endsWith(layoutFileName.toLowerCase()));
        if (layoutPath) {
          const layoutContent = await zip.file(layoutPath).async('string');
          const layoutDoc = parser.parseFromString(layoutContent, 'text/xml');
          const layoutRelsPath = layoutPath.replace('slideLayouts/', 'slideLayouts/_rels/') + '.rels';
          const layoutRelMap = await loadRels(zip, layoutRelsPath);

          const layoutColor = extractBgColor(layoutDoc);
          if (layoutColor) slideBgColor = layoutColor;

          const slideMasterTarget = Object.values(layoutRelMap).find(t => t.includes('slideMaster'));
          if (slideMasterTarget) {
            const masterFileName = decodeURIComponent(slideMasterTarget.split('/').pop());
            const masterPath = Object.keys(zip.files).find(k => k.toLowerCase().endsWith(masterFileName.toLowerCase()));
            if (masterPath) {
               const masterContent = await zip.file(masterPath).async('string');
               const masterDoc = parser.parseFromString(masterContent, 'text/xml');
               const masterRelsPath = masterPath.replace('slideMasters/', 'slideMasters/_rels/') + '.rels';
               const masterRelMap = await loadRels(zip, masterRelsPath);

               const masterColor = extractBgColor(masterDoc);
               if (masterColor) slideBgColor = masterColor;

               const masterExt = await extractImages(masterDoc, masterRelMap, zip, CANVAS_WIDTH, canvasHeight.value, emuScale.value, currentZIndex, true);
               allItems = allItems.concat(masterExt.images);
               currentZIndex = masterExt.nextZIndex;
            }
          }

          const layoutExt = await extractImages(layoutDoc, layoutRelMap, zip, CANVAS_WIDTH, canvasHeight.value, emuScale.value, currentZIndex, true);
          allItems = allItems.concat(layoutExt.images);
          currentZIndex = layoutExt.nextZIndex;
        }
      }

      const slideColor = extractBgColor(xmlDoc);
      if (slideColor) slideBgColor = slideColor;

      const slideExt = await extractImages(xmlDoc, slideRelMap, zip, CANVAS_WIDTH, canvasHeight.value, emuScale.value, currentZIndex, false);
      allItems = allItems.concat(slideExt.images);
      currentZIndex = slideExt.nextZIndex;

      const shapes = Array.from(new Set([
        ...Array.from(xmlDoc.getElementsByTagName('p:sp')),
        ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'sp'))
      ]));
      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const txBody = shape.getElementsByTagName('p:txBody')[0] || shape.getElementsByTagNameNS('*', 'txBody')[0];
        if (!txBody) continue;

        const aTags = Array.from(new Set([
          ...Array.from(txBody.getElementsByTagName('a:t')),
          ...Array.from(txBody.getElementsByTagNameNS('*', 't'))
        ]));
        let combinedText = '';
        for (let j = 0; j < aTags.length; j++) {
          combinedText += aTags[j].textContent;
        }
        if (!combinedText.trim()) continue;

        let xfrm = shape.getElementsByTagName('a:xfrm')[0];
        if (!xfrm) xfrm = shape.getElementsByTagName('xfrm')[0];

        let x = 0, y = 0, w = 100, h = 50, rotation = 0;
        if (xfrm) {
          let off = xfrm.getElementsByTagName('a:off')[0] || xfrm.getElementsByTagName('off')[0];
          let ext = xfrm.getElementsByTagName('a:ext')[0] || xfrm.getElementsByTagName('ext')[0];
          let rotAttr = xfrm.getAttribute('rot');
          if (rotAttr) rotation = parseInt(rotAttr, 10) / 60000;

          if (off) {
            x = parseInt(off.getAttribute('x') || '0', 10) / emuScale.value;
            y = parseInt(off.getAttribute('y') || '0', 10) / emuScale.value;
          }
          if (ext) {
            w = parseInt(ext.getAttribute('cx') || '0', 10) / emuScale.value;
            h = parseInt(ext.getAttribute('cy') || '0', 10) / emuScale.value;
          }
        }

        let fontSize = 18;
        let isBold = false;
        let isItalic = false;
        let isUnderline = false;
        let color = '#000000';
        let align = 'l';

        let rPr = txBody.getElementsByTagName('a:rPr')[0] || txBody.getElementsByTagName('rPr')[0];
        if (rPr) {
          if (rPr.getAttribute('sz')) fontSize = Math.round(parseInt(rPr.getAttribute('sz'), 10) / 100);
          if (rPr.getAttribute('b') === '1') isBold = true;
          if (rPr.getAttribute('i') === '1') isItalic = true;
          if (rPr.getAttribute('u') === 'sng') isUnderline = true;

          let srgbClr = rPr.getElementsByTagName('a:srgbClr')[0] || rPr.getElementsByTagName('srgbClr')[0];
          if (srgbClr && srgbClr.getAttribute('val')) {
            color = '#' + srgbClr.getAttribute('val');
          }
        }

        let pPr = txBody.getElementsByTagName('a:pPr')[0] || txBody.getElementsByTagName('pPr')[0];
        if (pPr && pPr.getAttribute('algn')) {
          align = pPr.getAttribute('algn');
        }

        let cNvPr = shape.getElementsByTagName('p:cNvPr')[0] || shape.getElementsByTagName('cNvPr')[0];
        const id = cNvPr ? cNvPr.getAttribute('id') : `text_${i}_${slideNumber}`;

        allItems.push({
          type: 'text',
          id,
          originalShapeNode: shape,
          x, y, w, h, rotation,
          text: combinedText,
          fontSize, isBold, isItalic, isUnderline, color, align,
          zIndex: currentZIndex++
        });
      }

      parsedSlides.push({
        fileName: slideFileName,
        slideNumber: parseInt(slideNumber, 10),
        items: allItems,
        bgColor: slideBgColor
      });
    }

    slideXmlDocs.value = newSlideXmlDocs;
    slidesData.value = parsedSlides;
    if (parsedSlides.length > 0) activeSlideIndex.value = 0;

    await nextTick();
    updateScale();
    initInteract();

  } catch (err) {
    console.error('Error parsing PPTX', err);
    alert('Failed to parse PPTX file. The file might be corrupted or unsupported.');
  } finally {
    isProcessing.value = false;
  }
};

const initInteract = () => {
  interact('.canvas-element').draggable({
    modifiers: [ interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true }) ],
    listeners: {
      move(event) {
        const id = event.target.getAttribute('data-id');
        const item = activeSlide.value.items.find(e => e.id === id);
        if (item) {
            item.x += event.dx / canvasScale.value;
            item.y += event.dy / canvasScale.value;
        }
      }
    }
  }).resizable({
    edges: {
      left: '.left-edge, .top-left, .bottom-left',
      right: '.right-edge, .top-right, .bottom-right',
      bottom: '.bottom-edge, .bottom-left, .bottom-right',
      top: '.top-edge, .top-left, .top-right'
    },
    modifiers: [ interact.modifiers.restrictEdges({ outer: 'parent' }), interact.modifiers.restrictSize({ min: { width: 30, height: 20 } }) ],
    listeners: {
      move(event) {
        const id = event.target.getAttribute('data-id');
        const item = activeSlide.value.items.find(e => e.id === id);
        if (item) {
          item.x += event.deltaRect.left / canvasScale.value;
          item.y += event.deltaRect.top / canvasScale.value;
          item.w += event.deltaRect.width / canvasScale.value;
          item.h += event.deltaRect.height / canvasScale.value;
        }
      }
    }
  });
};

onMounted(() => {
  window.addEventListener('resize', updateScale);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScale);
  interact('.canvas-element').unset();
});

const activeSlide = computed(() => slidesData.value.length ? slidesData.value[activeSlideIndex.value] : null);

const selectElement = (item) => {
  if (item.type !== 'bg') activeElement.value = item;
};

const clearSelection = (e) => {
  if (e.target.classList.contains('slide-canvas') || e.target.classList.contains('canvas-watermark')) {
    activeElement.value = { type: 'slide', id: 'slide_bg' };
  }
};

const addTextBox = () => {
  if (!activeSlide.value) return;
  const newItem = {
    type: 'text',
    id: `new_text_${Date.now()}`,
    isNew: true,
    x: CANVAS_WIDTH / 2 - 100,
    y: canvasHeight.value / 2 - 25,
    w: 200, h: 50, rotation: 0,
    text: 'New Text',
    fontSize: 24, isBold: false, isItalic: false, isUnderline: false, color: '#000000', align: 'ctr',
    zIndex: Math.max(...activeSlide.value.items.map(i => i.zIndex || 0), 100) + 1
  };
  activeSlide.value.items.push(newItem);
  activeElement.value = newItem;
};

const deleteActiveElement = () => {
  if (!activeElement.value || !activeSlide.value) return;
  if (!activeElement.value.isNew && activeElement.value.originalShapeNode) {
     const node = activeElement.value.originalShapeNode;
     if (node.parentNode) node.parentNode.removeChild(node);
  }
  const index = activeSlide.value.items.findIndex(i => i.id === activeElement.value.id);
  if (index > -1) activeSlide.value.items.splice(index, 1);
  activeElement.value = null;
};

const createNewTextShapeXml = (xmlDoc, el, newId) => {
  const parser = new DOMParser();
  const template = `
    <p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
      <p:nvSpPr>
        <p:cNvPr id="${newId}" name="TextBox ${newId}" />
        <p:cNvSpPr txBox="1" />
        <p:nvPr />
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm rot="${Math.round(el.rotation * 60000)}">
          <a:off x="${Math.round(el.x * emuScale.value)}" y="${Math.round(el.y * emuScale.value)}"/>
          <a:ext cx="${Math.round(el.w * emuScale.value)}" cy="${Math.round(el.h * emuScale.value)}"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" rtlCol="0"><a:spAutoFit/></a:bodyPr>
        <a:lstStyle/>
      </p:txBody>
    </p:sp>
  `;
  const doc = parser.parseFromString(template, 'text/xml');
  return xmlDoc.importNode(doc.documentElement, true);
};

const startRotation = (e, item) => {
  e.stopPropagation();
  e.preventDefault();

  const el = document.querySelector(`.canvas-element[data-id="${item.id}"]`);
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const onMouseMove = (moveEvent) => {
    const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
    let degrees = (angle * 180) / Math.PI;
    degrees -= 90; // offset so bottom anchor corresponds to 0
    degrees = (degrees + 360) % 360;

    // Snap to 45 degree increments if shift is pressed
    if (moveEvent.shiftKey) {
        degrees = Math.round(degrees / 45) * 45;
    }

    item.rotation = Math.round(degrees);
  };

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};

const downloadEditedPptx = async () => {
  if (!file.value || slidesData.value.length === 0) return;
  isProcessing.value = true;
  try {
    const zip = await JSZip.loadAsync(file.value);

    for (const slide of slidesData.value) {
      const xmlDoc = slideXmlDocs.value[slide.fileName];

      // Save slide background color
      if (slide.bgColor && slide.bgColor !== '#ffffff') {
         let bgNode = xmlDoc.getElementsByTagName('p:bg')[0] || xmlDoc.getElementsByTagNameNS('*', 'bg')[0];
         if (!bgNode) {
             const cSld = xmlDoc.getElementsByTagName('p:cSld')[0] || xmlDoc.getElementsByTagNameNS('*', 'cSld')[0];
             if (cSld) {
                 const bgXml = `<p:bg xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:bgPr><a:solidFill><a:srgbClr val="${slide.bgColor.replace('#', '')}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`;
                 const parser = new DOMParser();
                 const doc = parser.parseFromString(bgXml, 'text/xml');
                 cSld.insertBefore(xmlDoc.importNode(doc.documentElement, true), cSld.firstChild);
             }
         } else {
             let solidFill = bgNode.getElementsByTagName('a:solidFill')[0] || bgNode.getElementsByTagNameNS('*', 'solidFill')[0];
             if (!solidFill) {
                 let bgPr = bgNode.getElementsByTagName('p:bgPr')[0] || bgNode.getElementsByTagNameNS('*', 'bgPr')[0];
                 if (bgPr) {
                     const sf = xmlDoc.createElement('a:solidFill');
                     const clr = xmlDoc.createElement('a:srgbClr');
                     clr.setAttribute('val', slide.bgColor.replace('#', ''));
                     sf.appendChild(clr);
                     Array.from(bgPr.childNodes).filter(n => n.nodeName.includes('Fill')).forEach(n => bgPr.removeChild(n));
                     bgPr.appendChild(sf);
                 }
             } else {
                 let srgbClr = solidFill.getElementsByTagName('a:srgbClr')[0] || solidFill.getElementsByTagNameNS('*', 'srgbClr')[0];
                 if (srgbClr) srgbClr.setAttribute('val', slide.bgColor.replace('#', ''));
             }
         }
      }

      for (const el of slide.items) {
        if (el.type === 'bg') continue; // don't move backgrounds from master

        if (el.isNew) {
           const spTree = xmlDoc.getElementsByTagName('p:spTree')[0] || xmlDoc.getElementsByTagNameNS('*', 'spTree')[0];
           if (spTree) {
              const cNvPrs = Array.from(new Set([
                ...Array.from(spTree.getElementsByTagName('p:cNvPr')),
                ...Array.from(spTree.getElementsByTagNameNS('*', 'cNvPr'))
              ]));
              const maxId = cNvPrs.length > 0 ? Math.max(...cNvPrs.map(n => parseInt(n.getAttribute('id') || '0', 10))) : 0;
              const newShape = createNewTextShapeXml(xmlDoc, el, maxId + 1);
              spTree.appendChild(newShape);
              el.originalShapeNode = newShape;
              el.isNew = false;
           }
        }

        const shape = el.originalShapeNode;
        if (!shape) continue;

        let xfrm = shape.getElementsByTagName('a:xfrm')[0] || shape.getElementsByTagName('xfrm')[0];
        if (xfrm) {
          if (el.rotation) {
             xfrm.setAttribute('rot', Math.round(el.rotation * 60000).toString());
          } else {
             xfrm.removeAttribute('rot');
          }

          let off = xfrm.getElementsByTagName('a:off')[0] || xfrm.getElementsByTagName('off')[0];
          let ext = xfrm.getElementsByTagName('a:ext')[0] || xfrm.getElementsByTagName('ext')[0];
          if (off) {
            off.setAttribute('x', Math.round(el.x * emuScale.value));
            off.setAttribute('y', Math.round(el.y * emuScale.value));
          }
          if (ext) {
            ext.setAttribute('cx', Math.round(el.w * emuScale.value));
            ext.setAttribute('cy', Math.round(el.h * emuScale.value));
          }
        }

        if (el.type === 'text') {
          let txBody = shape.getElementsByTagName('p:txBody')[0] || shape.getElementsByTagName('txBody')[0];
          if (txBody) {
            let paragraphs = Array.from(new Set([
              ...Array.from(txBody.getElementsByTagName('a:p')),
              ...Array.from(txBody.getElementsByTagName('p'))
            ]));
            paragraphs.forEach(p => p.parentNode.removeChild(p));

            const lines = el.text.split('\n');
            for (const line of lines) {
              const newP = xmlDoc.createElement('a:p');
              const newPPr = xmlDoc.createElement('a:pPr');
              newPPr.setAttribute('algn', el.align);
              newP.appendChild(newPPr);

              const newR = xmlDoc.createElement('a:r');
              const newRPr = xmlDoc.createElement('a:rPr');
              newRPr.setAttribute('lang', 'en-US');
              newRPr.setAttribute('sz', Math.round(el.fontSize * 100).toString());
              if (el.isBold) newRPr.setAttribute('b', '1');
              if (el.isItalic) newRPr.setAttribute('i', '1');
              if (el.isUnderline) newRPr.setAttribute('u', 'sng');

              const solidFill = xmlDoc.createElement('a:solidFill');
              const srgbClr = xmlDoc.createElement('a:srgbClr');
              srgbClr.setAttribute('val', el.color.replace('#', ''));
              solidFill.appendChild(srgbClr);
              newRPr.appendChild(solidFill);

              newR.appendChild(newRPr);
              const newT = xmlDoc.createElement('a:t');
              newT.textContent = line || ' ';
              newR.appendChild(newT);

              newP.appendChild(newR);
              txBody.appendChild(newP);
            }
          }
        }
      }

      const spTree = xmlDoc.getElementsByTagName('p:spTree')[0] || xmlDoc.getElementsByTagNameNS('*', 'spTree')[0];
      if (spTree) {
         const sortedItems = [...slide.items].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
         for (const item of sortedItems) {
            if (item.type !== 'bg' && item.originalShapeNode) {
               spTree.appendChild(item.originalShapeNode);
            }
         }
      }

      const serializer = new XMLSerializer();
      zip.file(slide.fileName, serializer.serializeToString(xmlDoc));
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `edited_${fileName.value}`);
  } catch (err) {
    console.error('Error saving PPTX', err);
    alert('Failed to generate the edited PPTX.');
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <v-container class="py-8 px-4 h-100 max-w-xl mx-auto ppt-container">
    <div class="mb-6 d-flex align-center justify-space-between flex-wrap gap-4">
      <div>
        <h1 class="text-h3 font-weight-bold mb-1">Visual PPTX Editor</h1>
        <p class="text-subtitle-1 text-grey mb-0">Full certificate & presentation visual editor.</p>
      </div>
      <v-btn v-if="slidesData.length > 0" color="primary" size="large" prepend-icon="mdi-download" @click="downloadEditedPptx" :loading="isProcessing" rounded="pill" elevation="3">
        Export Presentation
      </v-btn>
    </div>

    <v-card v-if="slidesData.length === 0" class="pa-8 text-center upload-card" rounded="xl" elevation="2">
      <v-icon size="64" color="primary" class="mb-4">mdi-file-powerpoint</v-icon>
      <h3 class="text-h5 font-weight-medium mb-2">Open a PowerPoint File</h3>
      <p class="text-body-1 text-grey mb-6">Select a .pptx file (like a Certificate) to begin editing visually.</p>
      <v-file-input label="Choose .pptx File" accept=".pptx" variant="solo-filled" color="primary" hide-details @change="handleFileUpload" :loading="isProcessing" prepend-inner-icon="mdi-upload" prepend-icon="" class="mx-auto max-w-sm"></v-file-input>
    </v-card>

    <div v-else class="editor-layout d-flex flex-column">
      <!-- Toolbar -->
      <v-toolbar class="editor-toolbar mb-4 rounded-lg px-2 overflow-x-auto" elevation="2" density="compact">
        <!-- Global Actions -->
        <v-btn prepend-icon="mdi-format-text" variant="tonal" size="small" color="primary" class="mr-2" @click="addTextBox">Add Text</v-btn>

        <v-divider vertical class="mx-3"></v-divider>

        <!-- Contextual Formatting Tools -->
        <template v-if="activeElement?.type === 'slide'">
          <v-icon color="grey-darken-1" size="small" class="mr-2">mdi-palette-outline</v-icon>
          <span class="text-caption font-weight-bold text-grey-darken-2 mr-2">Slide Background:</span>
          <input type="color" v-model="activeSlide.bgColor" class="color-picker-input border rounded" />
        </template>

        <div v-else-if="activeElement?.type === 'text'" class="d-flex align-center ga-1">
            <v-btn icon="mdi-format-font-size-decrease" size="small" variant="text" @click="activeElement.fontSize -= 2"></v-btn>
            <span class="font-weight-bold px-1" style="min-width: 32px; text-align: center;">{{ activeElement.fontSize }}</span>
            <v-btn icon="mdi-format-font-size-increase" size="small" variant="text" @click="activeElement.fontSize += 2"></v-btn>
            <v-divider vertical class="mx-2 my-2"></v-divider>

            <v-btn :color="activeElement.isBold ? 'primary' : 'default'" icon="mdi-format-bold" size="small" variant="text" @click="activeElement.isBold = !activeElement.isBold"></v-btn>
            <v-btn :color="activeElement.isItalic ? 'primary' : 'default'" icon="mdi-format-italic" size="small" variant="text" @click="activeElement.isItalic = !activeElement.isItalic"></v-btn>
            <v-btn :color="activeElement.isUnderline ? 'primary' : 'default'" icon="mdi-format-underline" size="small" variant="text" @click="activeElement.isUnderline = !activeElement.isUnderline"></v-btn>
            <v-divider vertical class="mx-2 my-2"></v-divider>

            <v-btn :color="activeElement.align === 'l' ? 'primary' : 'default'" icon="mdi-format-align-left" size="small" variant="text" @click="activeElement.align = 'l'"></v-btn>
            <v-btn :color="activeElement.align === 'ctr' ? 'primary' : 'default'" icon="mdi-format-align-center" size="small" variant="text" @click="activeElement.align = 'ctr'"></v-btn>
            <v-btn :color="activeElement.align === 'r' ? 'primary' : 'default'" icon="mdi-format-align-right" size="small" variant="text" @click="activeElement.align = 'r'"></v-btn>
            <v-divider vertical class="mx-2 my-2"></v-divider>

            <input type="color" v-model="activeElement.color" class="color-picker-input ml-2 border rounded" />
        </div>

        <div v-else class="d-flex align-center">
            <span class="text-caption text-grey ml-2">Select an item or the slide background to edit.</span>
        </div>

        <v-spacer></v-spacer>

        <!-- Element Operations (Hidden if slide bg) -->
        <div v-if="activeElement && activeElement.type !== 'slide'" class="d-flex align-center ga-1">
             <v-btn icon="mdi-arrange-bring-forward" size="small" variant="text" @click="activeElement.zIndex += 1" title="Bring Forward"></v-btn>
             <v-btn icon="mdi-arrange-send-backward" size="small" variant="text" @click="activeElement.zIndex -= 1" title="Send Backward"></v-btn>
             <v-divider vertical class="mx-2 my-2"></v-divider>
             <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="deleteActiveElement" title="Delete Element"></v-btn>
        </div>
      </v-toolbar>

      <div class="canvas-wrapper bg-grey-lighten-3 rounded-lg overflow-hidden d-flex justify-center position-relative w-100" :style="{ height: (canvasHeight * canvasScale + 64) + 'px' }">
        <div class="slide-canvas bg-white position-relative mt-8" :style="{ width: CANVAS_WIDTH + 'px', height: canvasHeight + 'px', backgroundColor: activeSlide.bgColor + ' !important', transform: `scale(${canvasScale})`, transformOrigin: 'top center', outline: activeElement?.type === 'slide' ? '3px solid #8b3dff' : 'none' }" @mousedown="clearSelection">
          <div class="canvas-watermark" v-if="!activeSlide.bgColor || activeSlide.bgColor === '#ffffff'"></div>

          <div v-for="item in activeSlide.items" :key="item.id" :data-id="item.id"
               class="position-absolute d-flex flex-column"
               :class="{ 'canvas-element': item.type !== 'bg', 'is-active': activeElement?.id === item.id }"
               :style="{ left: item.x + 'px', top: item.y + 'px', width: item.w + 'px', height: item.h + 'px', zIndex: item.zIndex, transform: `rotate(${item.rotation || 0}deg)` }"
               @mousedown="item.type !== 'bg' && selectElement(item)">

            <img v-if="item.type === 'bg' || item.type === 'image'" :src="item.dataUrl" class="w-100 h-100" :style="{ objectFit: 'fill', pointerEvents: 'none' }" />

            <textarea v-if="item.type === 'text'" v-model="item.text" class="element-textarea w-100 h-100 pa-1" :style="{ fontSize: (item.fontSize * (CANVAS_WIDTH / 960)) + 'px', fontWeight: item.isBold ? 'bold' : 'normal', fontStyle: item.isItalic ? 'italic' : 'normal', textDecoration: item.isUnderline ? 'underline' : 'none', color: item.color, textAlign: item.align === 'ctr' ? 'center' : item.align === 'r' ? 'right' : 'left' }" spellcheck="false"></textarea>

            <!-- Canva style resize handles -->
            <div v-if="item.type !== 'bg'" class="resize-handle corner-handle top-left"></div>
            <div v-if="item.type !== 'bg'" class="resize-handle corner-handle top-right"></div>
            <div v-if="item.type !== 'bg'" class="resize-handle corner-handle bottom-left"></div>
            <div v-if="item.type !== 'bg'" class="resize-handle corner-handle bottom-right"></div>

            <div v-if="item.type !== 'bg'" class="resize-handle edge-handle left-edge"></div>
            <div v-if="item.type !== 'bg'" class="resize-handle edge-handle right-edge"></div>

            <div v-if="item.type !== 'bg'" class="resize-handle edge-handle-h top-edge"></div>
            <div v-if="item.type !== 'bg'" class="resize-handle edge-handle-h bottom-edge"></div>

            <!-- Bottom Action Controls -->
            <div v-if="item.type !== 'bg'" class="action-controls position-absolute d-flex justify-center ga-2 w-100" style="bottom: -45px; left: 0;">
              <div class="control-btn" @mousedown="startRotation($event, item)">
                <v-icon size="16">mdi-sync</v-icon>
              </div>
              <div class="control-btn drag-handle">
                <v-icon size="16">mdi-cursor-move</v-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Slide Navigation -->
      <div class="d-flex align-center justify-center mt-6 bg-white rounded-lg elevation-2 py-2 px-6 mx-auto w-100 max-w-sm">
        <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="activeSlideIndex--" :disabled="activeSlideIndex === 0"></v-btn>
        <span class="font-weight-bold px-6 text-subtitle-1">Slide {{ activeSlide?.slideNumber || 1 }} / {{ slidesData.length }}</span>
        <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="activeSlideIndex++" :disabled="activeSlideIndex === slidesData.length - 1"></v-btn>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
.ppt-container { max-width: 1100px; }
.upload-card { border: 2px dashed rgba(var(--v-theme-primary), 0.3); transition: border-color 0.3s; }
.upload-card:hover { border-color: rgba(var(--v-theme-primary), 0.8); }
.editor-toolbar { background: white; }
.color-picker-input { width: 32px; height: 32px; border: none; border-radius: 4px; cursor: pointer; padding: 0; background: none; }
.canvas-wrapper { border: 1px solid rgba(0,0,0,0.1); padding: 32px; overflow: auto; }
.slide-canvas { box-shadow: 0 4px 12px rgba(0,0,0,0.15); user-select: none; }
.canvas-element { transition: outline-color 0.1s; }
.canvas-element:hover { outline: 1px dashed rgba(0,0,0,0.3); cursor: pointer; }
.canvas-element.is-active { outline: 1px solid #8b3dff; z-index: 101 !important; }
.element-textarea { background: transparent; border: none; outline: none; resize: none; font-family: inherit; line-height: 1.2; overflow: hidden; cursor: text; }

.resize-handle { display: none; position: absolute; background: white; border: 1px solid #8b3dff; }
.canvas-element.is-active .resize-handle { display: block; }

/* Corner Circles */
.corner-handle { width: 12px; height: 12px; border-radius: 50%; }
.top-left { top: -6px; left: -6px; cursor: nwse-resize; }
.top-right { top: -6px; right: -6px; cursor: nesw-resize; }
.bottom-left { bottom: -6px; left: -6px; cursor: nesw-resize; }
.bottom-right { bottom: -6px; right: -6px; cursor: nwse-resize; }

/* Edge Pills */
.edge-handle { width: 6px; height: 16px; border-radius: 4px; }
.left-edge { top: calc(50% - 8px); left: -3px; cursor: ew-resize; }
.right-edge { top: calc(50% - 8px); right: -3px; cursor: ew-resize; }

/* Horizontal Edge Pills */
.edge-handle-h { width: 16px; height: 6px; border-radius: 4px; }
.top-edge { left: calc(50% - 8px); top: -3px; cursor: ns-resize; }
.bottom-edge { left: calc(50% - 8px); bottom: -3px; cursor: ns-resize; }

/* Action Controls */
.action-controls { display: none; }
.canvas-element.is-active .action-controls { display: flex; }
.control-btn { width: 30px; height: 30px; background: white; border: 1px solid #dcdcdc; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); pointer-events: auto; }
.control-btn:hover { background: #f5f5f5; }
.drag-handle { cursor: move; }
</style>
