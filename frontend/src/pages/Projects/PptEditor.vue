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

const extractSlideElements = async (xmlDoc, relMap, zip, canvasW, canvasH, emuScaleVal, startingZIndex, isLockedGroup) => {
  const elements = [];
  let zIdx = startingZIndex;

  const spTree = xmlDoc.getElementsByTagName('p:spTree')[0] || xmlDoc.getElementsByTagNameNS('*', 'spTree')[0];
  if (!spTree) return { elements, nextZIndex: zIdx };

  const processNode = async (node, parentTransform) => {
    if (!node || !node.nodeName) return;
    const nName = node.nodeName.replace(/^.*:/, '');

    if (nName === 'grpSp') {
      let grpSpPr = node.getElementsByTagName('p:grpSpPr')[0] || node.getElementsByTagNameNS('*', 'grpSpPr')[0];
      let currentTransform = { ...parentTransform };
      if (grpSpPr) {
        let xfrm = grpSpPr.getElementsByTagName('a:xfrm')[0] || grpSpPr.getElementsByTagNameNS('*', 'xfrm')[0];
        if (xfrm) {
          let chOff = xfrm.getElementsByTagName('a:chOff')[0] || xfrm.getElementsByTagNameNS('*', 'chOff')[0];
          let chExt = xfrm.getElementsByTagName('a:chExt')[0] || xfrm.getElementsByTagNameNS('*', 'chExt')[0];
          let off = xfrm.getElementsByTagName('a:off')[0] || xfrm.getElementsByTagNameNS('*', 'off')[0];
          let ext = xfrm.getElementsByTagName('a:ext')[0] || xfrm.getElementsByTagNameNS('*', 'ext')[0];

          let ox = off ? parseInt(off.getAttribute('x') || '0', 10) / emuScaleVal : 0;
          let oy = off ? parseInt(off.getAttribute('y') || '0', 10) / emuScaleVal : 0;
          let w = ext ? parseInt(ext.getAttribute('cx') || '0', 10) / emuScaleVal : 0;
          let h = ext ? parseInt(ext.getAttribute('cy') || '0', 10) / emuScaleVal : 0;

          let chOx = chOff ? parseInt(chOff.getAttribute('x') || '0', 10) / emuScaleVal : ox;
          let chOy = chOff ? parseInt(chOff.getAttribute('y') || '0', 10) / emuScaleVal : oy;
          let chW = chExt ? parseInt(chExt.getAttribute('cx') || '0', 10) / emuScaleVal : w;
          let chH = chExt ? parseInt(chExt.getAttribute('cy') || '0', 10) / emuScaleVal : h;

          currentTransform = { ox, oy, w, h, chOx, chOy, chW, chH };
        }
      }
      const children = Array.from(node.childNodes);
      for (const child of children) {
        await processNode(child, currentTransform);
      }
    } else if (nName === 'sp' || nName === 'pic' || nName === 'cxnSp') {
      let x = 0, y = 0, w = 100, h = 50, rotation = 0;
      let spPr = node.getElementsByTagName('p:spPr')[0] || node.getElementsByTagNameNS('*', 'spPr')[0];
      let xfrm = spPr ? (spPr.getElementsByTagName('a:xfrm')[0] || spPr.getElementsByTagNameNS('*', 'xfrm')[0]) : null;

      if (xfrm) {
        let off = xfrm.getElementsByTagName('a:off')[0] || xfrm.getElementsByTagNameNS('*', 'off')[0];
        let ext = xfrm.getElementsByTagName('a:ext')[0] || xfrm.getElementsByTagNameNS('*', 'ext')[0];
        let rotAttr = xfrm.getAttribute('rot');
        if (rotAttr) rotation = parseInt(rotAttr, 10) / 60000;

        if (off) {
          x = parseInt(off.getAttribute('x') || '0', 10) / emuScaleVal;
          y = parseInt(off.getAttribute('y') || '0', 10) / emuScaleVal;
        }
        if (ext) {
          w = parseInt(ext.getAttribute('cx') || '0', 10) / emuScaleVal;
          h = parseInt(ext.getAttribute('cy') || '0', 10) / emuScaleVal;
        }
      }

      if (parentTransform && parentTransform.chW) {
        let scaleX = parentTransform.w / parentTransform.chW;
        let scaleY = parentTransform.h / parentTransform.chH;
        x = parentTransform.ox + (x - parentTransform.chOx) * scaleX;
        y = parentTransform.oy + (y - parentTransform.chOy) * scaleY;
        w = w * scaleX;
        h = h * scaleY;
      }

      let blip = node.getElementsByTagName('a:blip')[0] || node.getElementsByTagNameNS('*', 'blip')[0];
      if (blip) {
        let rId = blip.getAttribute('r:embed') || blip.getAttribute('embed');
        if (!rId) {
          let embedAttr = Array.from(blip.attributes).find(a => a.name.includes('embed'));
          if (embedAttr) rId = embedAttr.value;
        }
        if (rId && relMap[rId]) {
          let targetRaw = relMap[rId];
          let mediaFilename = decodeURIComponent(targetRaw.split('/').pop());
          const zipKeys = Object.keys(zip.files);
          let matchedPath = zipKeys.find(k => k.toLowerCase().endsWith('/' + mediaFilename.toLowerCase())) || zipKeys.find(k => k.toLowerCase() === mediaFilename.toLowerCase());
          if (matchedPath && zip.files[matchedPath]) {
            try {
              const base64 = await zip.files[matchedPath].async('base64');
              const extName = mediaFilename.split('.').pop().toLowerCase();
              let mime = 'image/jpeg';
              if (extName === 'png') mime = 'image/png';
              else if (extName === 'svg') mime = 'image/svg+xml';
              else if (extName === 'gif') mime = 'image/gif';

              elements.push({
                type: 'image',
                isBg: isLockedGroup,
                id: `img_${zIdx}`,
                dataUrl: `data:${mime};base64,${base64}`,
                x, y, w, h, rotation,
                originalShapeNode: isLockedGroup ? null : node,
                zIndex: zIdx++
              });
              return;
            } catch (e) { }
          }
        }
      }

      let hasText = false;
      let combinedText = '';
      let txBody = node.getElementsByTagName('p:txBody')[0] || node.getElementsByTagNameNS('*', 'txBody')[0];

      let nvSpPr = node.getElementsByTagName('p:nvSpPr')[0] || node.getElementsByTagNameNS('*', 'nvSpPr')[0];
      let isPh = false;
      if (nvSpPr) {
        let ph = nvSpPr.getElementsByTagName('p:ph')[0] || nvSpPr.getElementsByTagNameNS('*', 'ph')[0];
        if (ph) isPh = true;
      }

      if (txBody && (!isLockedGroup || !isPh)) {
        const aTags = Array.from(new Set([
          ...Array.from(txBody.getElementsByTagName('a:t')),
          ...Array.from(txBody.getElementsByTagNameNS('*', 't'))
        ]));
        combinedText = aTags.map(t => t.textContent).join('');
        if (combinedText.trim()) hasText = true;
      }

      let shapeFill = 'transparent';
      let borderColor = 'transparent';
      let borderWidth = 0;
      let prst = 'rect';

      if (spPr) {
        const getClr = (parent) => {
          let srgbClr = parent.getElementsByTagName('a:srgbClr')[0] || parent.getElementsByTagNameNS('*', 'srgbClr')[0];
          if (srgbClr) return '#' + srgbClr.getAttribute('val');
          let schemeClr = parent.getElementsByTagName('a:schemeClr')[0] || parent.getElementsByTagNameNS('*', 'schemeClr')[0];
          if (schemeClr) {
            let val = schemeClr.getAttribute('val');
            if (val === 'bg1' || val === 'lt1') return '#ffffff';
            if (val === 'tx1' || val === 'dk1') return '#000000';
            if (val === 'bg2' || val === 'lt2') return '#e7e6e6';
            if (val === 'tx2' || val === 'dk2') return '#44546a';
            if (val === 'accent1') return '#4472c4';
            if (val === 'accent2') return '#ed7d31';
            if (val === 'accent3') return '#a5a5a5';
            if (val === 'accent4') return '#ffc000';
            if (val === 'accent5') return '#5b9bd5';
            if (val === 'accent6') return '#70ad47';
          }
          return null;
        };

        let solidFill = spPr.getElementsByTagName('a:solidFill')[0] || spPr.getElementsByTagNameNS('*', 'solidFill')[0];
        if (solidFill) {
          shapeFill = getClr(solidFill) || '#cccccc';
        }

        let ln = spPr.getElementsByTagName('a:ln')[0] || spPr.getElementsByTagNameNS('*', 'ln')[0];
        if (ln) {
          let noFill = ln.getElementsByTagName('a:noFill')[0] || ln.getElementsByTagNameNS('*', 'noFill')[0];
          if (!noFill) {
            let wAttr = ln.getAttribute('w');
            borderWidth = wAttr ? Math.max(1, Math.round(parseInt(wAttr, 10) / 9525)) : 1;
            let lnFill = ln.getElementsByTagName('a:solidFill')[0] || ln.getElementsByTagNameNS('*', 'solidFill')[0];
            if (lnFill) {
              borderColor = getClr(lnFill) || '#000000';
            } else {
              borderColor = '#000000';
            }
          }
        }

        let prstGeom = spPr.getElementsByTagName('a:prstGeom')[0] || spPr.getElementsByTagNameNS('*', 'prstGeom')[0];
        if (prstGeom) {
          prst = prstGeom.getAttribute('prst') || 'rect';
        }
      }

      if (hasText) {
        let fontSize = 18;
        let isBold = false, isItalic = false, isUnderline = false;
        let color = '#000000';
        let align = 'l';

        let rPr = txBody.getElementsByTagName('a:rPr')[0] || txBody.getElementsByTagNameNS('*', 'rPr')[0];
        if (rPr) {
          if (rPr.getAttribute('sz')) fontSize = Math.round(parseInt(rPr.getAttribute('sz'), 10) / 100);
          if (rPr.getAttribute('b') === '1') isBold = true;
          if (rPr.getAttribute('i') === '1') isItalic = true;
          if (rPr.getAttribute('u') === 'sng') isUnderline = true;

          let srgbClr = rPr.getElementsByTagName('a:srgbClr')[0] || rPr.getElementsByTagNameNS('*', 'srgbClr')[0];
          if (srgbClr && srgbClr.getAttribute('val')) color = '#' + srgbClr.getAttribute('val');
        }
        let pPr = txBody.getElementsByTagName('a:pPr')[0] || txBody.getElementsByTagNameNS('*', 'pPr')[0];
        if (pPr && pPr.getAttribute('algn')) align = pPr.getAttribute('algn');

        let cNvPr = nvSpPr ? (nvSpPr.getElementsByTagName('p:cNvPr')[0] || nvSpPr.getElementsByTagNameNS('*', 'cNvPr')[0]) : null;
        const id = cNvPr ? cNvPr.getAttribute('id') : `text_${zIdx}`;

        elements.push({
          type: 'text',
          isBg: isLockedGroup,
          id: isLockedGroup ? `bg_text_${zIdx}` : id,
          originalShapeNode: isLockedGroup ? null : node,
          x, y, w, h, rotation,
          text: combinedText,
          fontSize, isBold, isItalic, isUnderline, color, align,
          shapeFill, borderColor, borderWidth, prst,
          zIndex: zIdx++
        });
      } else if (shapeFill !== 'transparent' || borderWidth > 0) {
        elements.push({
          type: 'shape',
          isBg: isLockedGroup,
          id: `shape_${zIdx}`,
          originalShapeNode: isLockedGroup ? null : node,
          x, y, w, h, rotation,
          shapeFill, borderColor, borderWidth, prst,
          zIndex: zIdx++
        });
      }
    }
  };

  const children = Array.from(spTree.childNodes);
  for (const child of children) {
    await processNode(child, null);
  }

  const vImages = Array.from(new Set([
    ...Array.from(xmlDoc.getElementsByTagName('v:imagedata')),
    ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'imagedata'))
  ]));
  for (let i = 0; i < vImages.length; i++) {
    let vNode = vImages[i];
    let rId = vNode.getAttribute('r:id');
    if (rId && relMap[rId]) {
      let targetRaw = relMap[rId];
      let mediaFilename = decodeURIComponent(targetRaw.split('/').pop());
      const zipKeys = Object.keys(zip.files);
      let matchedPath = zipKeys.find(k => k.toLowerCase().endsWith('/' + mediaFilename.toLowerCase())) || zipKeys.find(k => k.toLowerCase() === mediaFilename.toLowerCase());
      if (matchedPath && zip.files[matchedPath]) {
        try {
          const base64 = await zip.files[matchedPath].async('base64');
          let pNode = vNode.parentNode;
          let x = 0, y = 0, w = 100, h = 100;
          if (pNode && pNode.getAttribute('style')) {
            let style = pNode.getAttribute('style');
            let m;
            if ((m = style.match(/left:([\d.]+)pt/))) x = parseFloat(m[1]) * 1.333;
            if ((m = style.match(/top:([\d.]+)pt/))) y = parseFloat(m[1]) * 1.333;
            if ((m = style.match(/width:([\d.]+)pt/))) w = parseFloat(m[1]) * 1.333;
            if ((m = style.match(/height:([\d.]+)pt/))) h = parseFloat(m[1]) * 1.333;
          }
          elements.push({
            type: 'image',
            isBg: isLockedGroup,
            id: `img_v_${zIdx}`,
            dataUrl: `data:image/jpeg;base64,${base64}`,
            x, y, w, h, rotation: 0,
            originalShapeNode: isLockedGroup ? null : pNode,
            zIndex: zIdx++
          });
        } catch (e) { }
      }
    }
  }

  return { elements, nextZIndex: zIdx };
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

              const masterExt = await extractSlideElements(masterDoc, masterRelMap, zip, CANVAS_WIDTH, canvasHeight.value, emuScale.value, currentZIndex, true);
              allItems = allItems.concat(masterExt.elements);
              currentZIndex = masterExt.nextZIndex;
            }
          }

          const layoutExt = await extractSlideElements(layoutDoc, layoutRelMap, zip, CANVAS_WIDTH, canvasHeight.value, emuScale.value, currentZIndex, true);
          allItems = allItems.concat(layoutExt.elements);
          currentZIndex = layoutExt.nextZIndex;
        }
      }

      const slideColor = extractBgColor(xmlDoc);
      if (slideColor) slideBgColor = slideColor;

      const slideExt = await extractSlideElements(xmlDoc, slideRelMap, zip, CANVAS_WIDTH, canvasHeight.value, emuScale.value, currentZIndex, false);
      allItems = allItems.concat(slideExt.elements);
      currentZIndex = slideExt.nextZIndex;

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
    modifiers: [interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true })],
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
    modifiers: [interact.modifiers.restrictEdges({ outer: 'parent' }), interact.modifiers.restrictSize({ min: { width: 30, height: 20 } })],
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
  if (!item.isBg) activeElement.value = item;
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

// Add shape to slide
const addShape = (type) => {
  if (!activeSlide.value) return;
  const newItem = {
    type: 'shape',
    id: `new_shape_${type}_${Date.now()}`,
    isNew: true,
    x: CANVAS_WIDTH / 2 - 60,
    y: canvasHeight.value / 2 - 30,
    w: 120, h: 60, rotation: 0,
    shapeFill: '#cccccc', borderColor: '#000000', borderWidth: 2, prst: type,
    zIndex: Math.max(...activeSlide.value.items.map(i => i.zIndex || 0), 100) + 1
  };
  activeSlide.value.items.push(newItem);
  activeElement.value = newItem;
};

// Add icon to slide
const addIcon = (mdiIcon) => {
  if (!activeSlide.value) return;
  const newItem = {
    type: 'icon',
    id: `new_icon_${Date.now()}`,
    isNew: true,
    x: CANVAS_WIDTH / 2 - 30,
    y: canvasHeight.value / 2 - 30,
    w: 60, h: 60, rotation: 0,
    mdiIcon,
    iconColor: '#000000',
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
        if (el.isBg) continue; // don't move backgrounds from master

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
          if (!item.isBg && item.originalShapeNode) {
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
  <div class="h-100 max-w-xl mx-auto ppt-container">
    <v-container v-if="slidesData.length === 0">
      <v-card class="pa-8 text-center upload-card" rounded="xl" elevation="0">
        <v-icon size="64" color="primary" class="mb-4">mdi-file-powerpoint</v-icon>
        <h3 class="text-h5 font-weight-medium mb-2">Open a PowerPoint File</h3>
        <p class="text-body-1 text-grey mb-6">Select a .pptx file (like a Certificate) to begin editing visually.</p>
        <v-file-input label="Choose .pptx File" accept=".pptx" variant="solo-filled" color="primary" hide-details
          @change="handleFileUpload" :loading="isProcessing" prepend-inner-icon="mdi-upload" prepend-icon=""
          class="mx-auto max-w-sm"></v-file-input>
      </v-card>
    </v-container>

    <div v-else class="editor-layout d-flex flex-column">
      <!-- Toolbar Row 1: Insert tools + Slide BG + Save -->
      <div class="editor-toolbar-row1 d-flex align-center flex-wrap px-2 py-1 ga-1">
        <v-btn prepend-icon="mdi-format-text" variant="tonal" size="x-small" color="primary"
          @click="addTextBox">Text</v-btn>

        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="tonal" size="x-small" color="primary"
              prepend-icon="mdi-shape-outline">Shapes</v-btn>
          </template>
          <v-list density="compact" nav>
            <v-list-item @click="addShape('rect')"
              prepend-icon="mdi-rectangle-outline"><v-list-item-title>Rectangle</v-list-item-title></v-list-item>
            <v-list-item @click="addShape('ellipse')"
              prepend-icon="mdi-circle-outline"><v-list-item-title>Circle</v-list-item-title></v-list-item>
            <v-list-item @click="addShape('triangle')"
              prepend-icon="mdi-triangle-outline"><v-list-item-title>Triangle</v-list-item-title></v-list-item>
            <v-list-item @click="addShape('star')"
              prepend-icon="mdi-star-outline"><v-list-item-title>Star</v-list-item-title></v-list-item>
            <v-list-item @click="addShape('arrow')"
              prepend-icon="mdi-arrow-right-thick"><v-list-item-title>Arrow</v-list-item-title></v-list-item>
            <v-list-item @click="addShape('line')"
              prepend-icon="mdi-minus"><v-list-item-title>Line</v-list-item-title></v-list-item>
            <v-list-item @click="addShape('pentagon')"
              prepend-icon="mdi-shape"><v-list-item-title>Pentagon</v-list-item-title></v-list-item>
            <v-list-item @click="addShape('hexagon')"
              prepend-icon="mdi-hexagon-outline"><v-list-item-title>Hexagon</v-list-item-title></v-list-item>
          </v-list>
        </v-menu>

        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="tonal" size="x-small" color="primary"
              prepend-icon="mdi-emoticon-outline">Icons</v-btn>
          </template>
          <v-list density="compact" nav>
            <v-list-item @click="addIcon('mdi-emoticon-happy-outline')"
              prepend-icon="mdi-emoticon-happy-outline"><v-list-item-title>Happy</v-list-item-title></v-list-item>
            <v-list-item @click="addIcon('mdi-emoticon-neutral-outline')"
              prepend-icon="mdi-emoticon-neutral-outline"><v-list-item-title>Neutral</v-list-item-title></v-list-item>
            <v-list-item @click="addIcon('mdi-emoticon-sad-outline')"
              prepend-icon="mdi-emoticon-sad-outline"><v-list-item-title>Sad</v-list-item-title></v-list-item>
            <v-list-item @click="addIcon('mdi-heart-outline')"
              prepend-icon="mdi-heart-outline"><v-list-item-title>Heart</v-list-item-title></v-list-item>
            <v-list-item @click="addIcon('mdi-star-outline')"
              prepend-icon="mdi-star-outline"><v-list-item-title>Star</v-list-item-title></v-list-item>
            <v-list-item @click="addIcon('mdi-flag-outline')"
              prepend-icon="mdi-flag-outline"><v-list-item-title>Flag</v-list-item-title></v-list-item>
            <v-list-item @click="addIcon('mdi-lightning-bolt-outline')"
              prepend-icon="mdi-lightning-bolt-outline"><v-list-item-title>Lightning</v-list-item-title></v-list-item>
            <v-list-item @click="addIcon('mdi-check-circle-outline')"
              prepend-icon="mdi-check-circle-outline"><v-list-item-title>Check</v-list-item-title></v-list-item>
          </v-list>
        </v-menu>

        <v-divider vertical class="mx-1" style="height:24px"></v-divider>

        <v-icon color="grey-darken-1" size="x-small">mdi-palette-outline</v-icon>
        <span class="toolbar-label">BG:</span>
        <input type="color" :value="activeSlide?.bgColor || '#ffffff'"
          @input="activeSlide && (activeSlide.bgColor = $event.target.value)"
          class="color-picker-input border rounded" />

        <v-spacer></v-spacer>

        <!-- Element layer controls -->
        <div class="d-flex align-center ga-1"
          :class="{ 'opacity-40': !activeElement || activeElement.type === 'slide' }">
          <v-btn icon="mdi-arrange-bring-forward" size="x-small" variant="text"
            :disabled="!activeElement || activeElement.type === 'slide'"
            @click="activeElement && activeElement.type !== 'slide' && (activeElement.zIndex += 1)"
            title="Bring Forward"></v-btn>
          <v-btn icon="mdi-arrange-send-backward" size="x-small" variant="text"
            :disabled="!activeElement || activeElement.type === 'slide'"
            @click="activeElement && activeElement.type !== 'slide' && (activeElement.zIndex -= 1)"
            title="Send Backward"></v-btn>
          <v-btn icon="mdi-delete" color="error" size="x-small" variant="tonal"
            :disabled="!activeElement || activeElement.type === 'slide'" @click="deleteActiveElement"
            title="Delete"></v-btn>
        </div>

        <v-btn color="primary" size="x-small" icon="mdi-download" @click="downloadEditedPptx" :loading="isProcessing"
          variant="flat">
        </v-btn>
      </div>

      <!-- Toolbar Row 2: Formatting tools (always visible, contextually active) -->
      <div class="editor-toolbar-row2 d-flex align-center flex-wrap px-2 py-1 ga-1">
        <!-- Text formatting -->
        <div class="d-flex align-center ga-1"
          :class="{ 'opacity-40': !activeElement || activeElement.type !== 'text' }">
          <span class="toolbar-label">Txt:</span>
          <v-btn icon="mdi-minus" size="x-small" variant="text"
            :disabled="!activeElement || activeElement.type !== 'text'"
            @click="activeElement && activeElement.type === 'text' && (activeElement.fontSize -= 2)"></v-btn>
          <span class="toolbar-counter">{{ activeElement?.type === 'text' ? activeElement.fontSize : '--' }}</span>
          <v-btn icon="mdi-plus" size="x-small" variant="text"
            :disabled="!activeElement || activeElement.type !== 'text'"
            @click="activeElement && activeElement.type === 'text' && (activeElement.fontSize += 2)"></v-btn>

          <v-divider vertical class="mx-1" style="height:20px"></v-divider>

          <v-btn :color="activeElement?.type === 'text' && activeElement.isBold ? 'primary' : 'default'"
            icon="mdi-format-bold" size="x-small" variant="text"
            :disabled="!activeElement || activeElement.type !== 'text'"
            @click="activeElement && activeElement.type === 'text' && (activeElement.isBold = !activeElement.isBold)"></v-btn>
          <v-btn :color="activeElement?.type === 'text' && activeElement.isItalic ? 'primary' : 'default'"
            icon="mdi-format-italic" size="x-small" variant="text"
            :disabled="!activeElement || activeElement.type !== 'text'"
            @click="activeElement && activeElement.type === 'text' && (activeElement.isItalic = !activeElement.isItalic)"></v-btn>
          <v-btn :color="activeElement?.type === 'text' && activeElement.isUnderline ? 'primary' : 'default'"
            icon="mdi-format-underline" size="x-small" variant="text"
            :disabled="!activeElement || activeElement.type !== 'text'"
            @click="activeElement && activeElement.type === 'text' && (activeElement.isUnderline = !activeElement.isUnderline)"></v-btn>

          <v-divider vertical class="mx-1" style="height:20px"></v-divider>

          <v-btn :color="activeElement?.type === 'text' && activeElement.align === 'l' ? 'primary' : 'default'"
            icon="mdi-format-align-left" size="x-small" variant="text"
            :disabled="!activeElement || activeElement.type !== 'text'"
            @click="activeElement && activeElement.type === 'text' && (activeElement.align = 'l')"></v-btn>
          <v-btn :color="activeElement?.type === 'text' && activeElement.align === 'ctr' ? 'primary' : 'default'"
            icon="mdi-format-align-center" size="x-small" variant="text"
            :disabled="!activeElement || activeElement.type !== 'text'"
            @click="activeElement && activeElement.type === 'text' && (activeElement.align = 'ctr')"></v-btn>
          <v-btn :color="activeElement?.type === 'text' && activeElement.align === 'r' ? 'primary' : 'default'"
            icon="mdi-format-align-right" size="x-small" variant="text"
            :disabled="!activeElement || activeElement.type !== 'text'"
            @click="activeElement && activeElement.type === 'text' && (activeElement.align = 'r')"></v-btn>

          <v-divider vertical class="mx-1" style="height:20px"></v-divider>
          <span class="toolbar-label">Color:</span>
          <input type="color" :value="activeElement?.type === 'text' ? activeElement.color : '#000000'"
            @input="(e) => { if (activeElement?.type === 'text') activeElement.color = e.target.value; }"
            class="color-picker-input border rounded" :disabled="!activeElement || activeElement.type !== 'text'" />
        </div>

        <v-divider vertical class="mx-2" style="height:20px"></v-divider>

        <!-- Shape / Icon color -->
        <div class="d-flex align-center ga-1"
          :class="{ 'opacity-40': !activeElement || (activeElement.type !== 'shape' && activeElement.type !== 'icon') }">
          <span class="toolbar-label">Fill:</span>
          <input type="color"
            :value="activeElement?.type === 'shape' ? activeElement.shapeFill : activeElement?.type === 'icon' ? activeElement.iconColor : '#cccccc'"
            @input="(e) => { if (activeElement?.type === 'shape') activeElement.shapeFill = e.target.value; if (activeElement?.type === 'icon') activeElement.iconColor = e.target.value; }"
            class="color-picker-input border rounded"
            :disabled="!activeElement || (activeElement.type !== 'shape' && activeElement.type !== 'icon')" />

          <span class="toolbar-label">Border:</span>
          <input type="color" :value="activeElement?.type === 'shape' ? activeElement.borderColor : '#000000'"
            @input="(e) => { if (activeElement?.type === 'shape') activeElement.borderColor = e.target.value; }"
            class="color-picker-input border rounded" :disabled="!activeElement || activeElement.type !== 'shape'" />
        </div>
      </div>

      <div
        class="canvas-wrapper bg-grey-lighten-2 overflow-hidden d-flex justify-center align-start position-relative w-100 elevation-1"
        :style="{ height: (canvasHeight * canvasScale + 80) + 'px', paddingTop: '16px' }">
        <div class="slide-canvas bg-white position-relative mt-8"
          :style="{ width: CANVAS_WIDTH + 'px', height: canvasHeight + 'px', backgroundColor: activeSlide?.bgColor || '#ffffff', transform: `scale(${canvasScale})`, transformOrigin: 'top center', outline: activeElement?.type === 'slide' ? '3px solid #8b3dff' : 'none' }"
          @mousedown="clearSelection">

          <!-- Clipped Layer: Contains background elements and all inactive elements -->
          <div class="slide-content-clip position-absolute w-100 h-100 overflow-hidden"
            style="top:0; left:0; clip-path: inset(0);">
            <div class="canvas-watermark" v-if="!activeSlide.bgColor || activeSlide.bgColor === '#ffffff'"></div>

            <template v-for="item in activeSlide.items" :key="'visual_'+item.id">
              <!-- Render background shapes/images and foreground items that are NOT currently being edited -->
              <div v-if="item.id !== activeElement?.id" v-show="!(item.isBg && item.type === 'text')"
                class="position-absolute d-flex flex-column" :class="{ 'canvas-element': !item.isBg }"
                :style="{ left: item.x + 'px', top: item.y + 'px', width: item.w + 'px', height: item.h + 'px', zIndex: item.zIndex, transform: `rotate(${item.rotation || 0}deg)`, opacity: item.muted ? 0.4 : 1 }"
                @mousedown="!item.isBg && selectElement(item)">

                <img v-if="item.type === 'image'" :src="item.dataUrl" class="w-100 h-100"
                  style="object-fit: fill; pointer-events: none;" />

                <div v-if="item.type === 'shape'" class="w-100 h-100 position-absolute" :style="{
                  backgroundColor: item.shapeFill,
                  border: item.borderWidth > 0 ? (item.borderWidth + 'px solid ' + item.borderColor) : 'none',
                  borderRadius: item.prst === 'ellipse' ? '50%' : '0',
                  clipPath: item.prst === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : item.prst === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : item.prst === 'arrow' ? 'polygon(0% 40%, 70% 40%, 70% 20%, 100% 50%, 70% 80%, 70% 60%, 0% 60%)' : item.prst === 'line' ? 'polygon(0% 50%, 100% 50%, 100% 55%, 0% 55%)' : item.prst === 'pentagon' ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' : item.prst === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' : 'none',
                  pointerEvents: 'none'
                }"></div>

                <v-icon v-if="item.type === 'icon'" :icon="item.mdiIcon" class="w-100 h-100"
                  :style="{ color: item.iconColor || '#000000', fontSize: '48px', pointerEvents: 'none', alignSelf: 'center', justifySelf: 'center' }"></v-icon>

                <textarea v-if="item.type === 'text'" v-model="item.text" class="element-textarea w-100 h-100 pa-1"
                  :style="{ fontSize: (item.fontSize * (CANVAS_WIDTH / 960)) + 'px', fontWeight: item.isBold ? 'bold' : 'normal', fontStyle: item.isItalic ? 'italic' : 'normal', textDecoration: item.isUnderline ? 'underline' : 'none', color: item.color, textAlign: item.align === 'ctr' ? 'center' : item.align === 'r' ? 'right' : 'left', pointerEvents: 'none' }"
                  readonly spellcheck="false"></textarea>
              </div>
            </template>
          </div>

          <!-- Unclipped Layer: Contains only the active element (so handles stay visible outside slide bounds) -->
          <template v-for="item in activeSlide.items" :key="'active_'+item.id">
            <div v-if="item.id === activeElement?.id"
              class="position-absolute d-flex flex-column canvas-element is-active" :data-id="item.id"
              :style="{ left: item.x + 'px', top: item.y + 'px', width: item.w + 'px', height: item.h + 'px', zIndex: 1000, transform: `rotate(${item.rotation || 0}deg)`, opacity: 1 }">

              <img v-if="item.type === 'image'" :src="item.dataUrl" class="w-100 h-100"
                style="object-fit: fill; pointer-events: none;" />

              <div v-if="item.type === 'shape'" class="w-100 h-100 position-absolute" :style="{
                backgroundColor: item.shapeFill,
                border: item.borderWidth > 0 ? (item.borderWidth + 'px solid ' + item.borderColor) : 'none',
                borderRadius: item.prst === 'ellipse' ? '50%' : '0',
                clipPath: item.prst === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : item.prst === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : item.prst === 'arrow' ? 'polygon(0% 40%, 70% 40%, 70% 20%, 100% 50%, 70% 80%, 70% 60%, 0% 60%)' : item.prst === 'line' ? 'polygon(0% 50%, 100% 50%, 100% 55%, 0% 55%)' : item.prst === 'pentagon' ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' : item.prst === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' : 'none',
                pointerEvents: 'none'
              }"></div>

              <v-icon v-if="item.type === 'icon'" :icon="item.mdiIcon" class="w-100 h-100"
                :style="{ color: item.iconColor || '#000000', fontSize: '48px', pointerEvents: 'none', alignSelf: 'center', justifySelf: 'center' }"></v-icon>

              <textarea v-if="item.type === 'text'" v-model="item.text" class="element-textarea w-100 h-100 pa-1"
                :style="{ fontSize: (item.fontSize * (CANVAS_WIDTH / 960)) + 'px', fontWeight: item.isBold ? 'bold' : 'normal', fontStyle: item.isItalic ? 'italic' : 'normal', textDecoration: item.isUnderline ? 'underline' : 'none', color: item.color, textAlign: item.align === 'ctr' ? 'center' : item.align === 'r' ? 'right' : 'left', pointerEvents: 'auto' }"
                spellcheck="false"></textarea>

              <!-- Handles -->
              <div class="resize-handle corner-handle top-left"></div>
              <div class="resize-handle corner-handle top-right"></div>
              <div class="resize-handle corner-handle bottom-left"></div>
              <div class="resize-handle corner-handle bottom-right"></div>
              <div class="resize-handle edge-handle left-edge"></div>
              <div class="resize-handle edge-handle right-edge"></div>
              <div class="resize-handle edge-handle-h top-edge"></div>
              <div class="resize-handle edge-handle-h bottom-edge"></div>
              <div class="action-controls position-absolute d-flex justify-center ga-2 w-100"
                style="bottom: -45px; left: 0;">
                <div class="control-btn" @mousedown="startRotation($event, item)">
                  <v-icon size="16">mdi-sync</v-icon>
                </div>
                <div class="control-btn drag-handle">
                  <v-icon size="16">mdi-cursor-move</v-icon>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Bottom Slide Navigation -->
      <div class="d-flex align-center justify-center bg-white rounded-0 py-2 px-6 mx-auto w-100 max-w-sm">
        <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="activeSlideIndex--"
          :disabled="activeSlideIndex === 0"></v-btn>
        <span class="font-weight-bold px-6 text-subtitle-1">Slide {{ activeSlide?.slideNumber || 1 }} / {{
          slidesData.length
          }}</span>
        <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="activeSlideIndex++"
          :disabled="activeSlideIndex === slidesData.length - 1"></v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ppt-container {
  max-width: 100%;
}

.upload-card {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  transition: border-color 0.3s;
}

.upload-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.8);
}

.editor-toolbar-row1,
.editor-toolbar-row2 {
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  min-height: 36px;
  flex-shrink: 0;
}

.editor-toolbar-row2 {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.toolbar-label {
  font-size: 10px;
  font-weight: 600;
  color: #555;
  white-space: nowrap;
}

.toolbar-counter {
  font-size: 11px;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.color-picker-input {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.canvas-wrapper {
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0px;
  overflow: auto;
}

.slide-canvas {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  user-select: none;
}

.canvas-element {
  transition: outline-color 0.1s;
}

.canvas-element:hover {
  outline: 1px dashed rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.canvas-element.is-active {
  outline: 1px solid #8b3dff;
  z-index: 101 !important;
}

.element-textarea {
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  line-height: 1.2;
  overflow: hidden;
  cursor: text;
}

.resize-handle {
  display: none;
  position: absolute;
  background: white;
  border: 1px solid #8b3dff;
}

.canvas-element.is-active .resize-handle {
  display: block;
}

/* Corner Circles */
.corner-handle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.top-left {
  top: -6px;
  left: -6px;
  cursor: nwse-resize;
}

.top-right {
  top: -6px;
  right: -6px;
  cursor: nesw-resize;
}

.bottom-left {
  bottom: -6px;
  left: -6px;
  cursor: nesw-resize;
}

.bottom-right {
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
}

/* Edge Pills */
.edge-handle {
  width: 6px;
  height: 16px;
  border-radius: 4px;
}

.left-edge {
  top: calc(50% - 8px);
  left: -3px;
  cursor: ew-resize;
}

.right-edge {
  top: calc(50% - 8px);
  right: -3px;
  cursor: ew-resize;
}

/* Horizontal Edge Pills */
.edge-handle-h {
  width: 16px;
  height: 6px;
  border-radius: 4px;
}

.top-edge {
  left: calc(50% - 8px);
  top: -3px;
  cursor: ns-resize;
}

.bottom-edge {
  left: calc(50% - 8px);
  bottom: -3px;
  cursor: ns-resize;
}

/* Action Controls */
.action-controls {
  display: none;
}

.canvas-element.is-active .action-controls {
  display: flex;
}

.control-btn {
  width: 30px;
  height: 30px;
  background: white;
  border: 1px solid #dcdcdc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
}

.control-btn:hover {
  background: #f5f5f5;
}

.drag-handle {
  cursor: move;
}
</style>
