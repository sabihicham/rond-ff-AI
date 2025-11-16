// عناصر DOM
const video = document.getElementById('video');
const startCam = document.getElementById('startCam');
const stopCam = document.getElementById('stopCam');
const snapBtn = document.getElementById('snapBtn');
const cameraSelect = document.getElementById('cameraSelect');
const scanResult = document.getElementById('scanResult');
const fileInput = document.getElementById('fileInput');
const langSwitcher = document.getElementById('langSwitcher');
const qrText = document.getElementById('qrText');
const genBtn = document.getElementById('genBtn');
const downloadQr = document.getElementById('downloadQr');
let qrCodeInstance = null;

let qrScanner = null;

// تحميل قائمة الكاميرات
async function loadCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === "videoinput");
    cameraSelect.innerHTML = "";
    cams.forEach((cam, i) => {
      const opt = document.createElement('option');
      opt.value = cam.deviceId;
      opt.textContent = cam.label || `كاميرا ${i + 1}`;
      cameraSelect.appendChild(opt);
    });
    // اختيار الكاميرا الأولى تلقائيًا
    if (cams.length > 0) cameraSelect.value = cams[0].deviceId;
  } catch (err) {
    console.error("خطأ في الحصول على الكاميرات:", err);
    alert("تعذر الوصول إلى الكاميرات. تأكد من السماح للمتصفح باستخدام الكاميرا.");
  }
}
loadCameras();

// تشغيل الكاميرا
startCam.addEventListener('click', async () => {
  if (qrScanner) qrScanner.stop();
  if (!cameraSelect.value) {
    alert("لم يتم العثور على كاميرا.");
    return;
  }
  try {
    qrScanner = new QrScanner(video, result => {
      scanResult.textContent = result;
    }, {
      preferredCamera: cameraSelect.value,
      highlightScanRegion: true
    });
    await qrScanner.start();
  } catch (err) {
    console.error("تعذر تشغيل الكاميرا:", err);
    alert("فشل تشغيل الكاميرا. تحقق من الإعدادات أو الصلاحيات.");
  }
});

// إيقاف الكاميرا
stopCam.addEventListener('click', () => {
  if (qrScanner) qrScanner.stop();
});

// التقاط صورة من الكاميرا
snapBtn.addEventListener('click', () => {
  if (!qrScanner) return alert("الكاميرا غير مفعّلة");
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  decodeBarcode(canvas.toDataURL('image/png'));
});

// قراءة QR/باركود من صورة
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => decodeBarcode(img);
  img.src = URL.createObjectURL(file);
});

// دالة قراءة QR أو باركود
function decodeBarcode(img) {
  QrScanner.scanImage(img)
    .then(res => scanResult.textContent = res)
    .catch(() => {
      Quagga.decodeSingle({
        src: typeof img === "string" ? img : img.src,
        numOfWorkers: 0,
        inputStream: { size: 800 },
        decoder: { readers: ["ean_reader","code_128_reader","code_39_reader"] }
      }, function(result) {
        if (result && result.codeResult) scanResult.textContent = result.codeResult.code;
        else scanResult.textContent = "لم يتم العثور على رمز";
      });
    });
}

// إنشاء QR
genBtn.addEventListener('click', () => {
  const text = qrText.value.trim();
  if (!text) return;
  if (qrCodeInstance) document.getElementById("qrcode").innerHTML = "";
  qrCodeInstance = new QRCode("qrcode", { text, width: 200, height: 200 });
  downloadQr.disabled = false;
});

// تحميل QR
downloadQr.addEventListener('click', () => {
  const img = document.querySelector('#qrcode img');
  if (!img) return;
  const a = document.createElement('a');
  a.href = img.src;
  a.download = "qrcode.png";
  a.click();
});
