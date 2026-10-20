/* ==========================================
   TEMPLATE CONFIGURATION
   Photo aperture coordinates are based on the
   transparent opening in eoe-dussehra-template.png.
========================================== */

const TEMPLATE_CONFIG = {
  image: "assets/eoe-dussehra-template.png",

  photoArea: {
    // Bounding box of the transparent photo opening, as % of the square template.
    left: 29.4,
    top: 35.25,
    width: 44.8,
    height: 44.7,

    // Shape of the slightly tilted photo opening, relative to the bounding box.
    // These points let the photo follow the actual frame, not a plain square.
    clipPoints: [
      [0, 1.0],
      [96, 0],
      [100, 94.5],
      [3.5, 100]
    ]
  }
};


/* ==========================================
   App elements
========================================== */

const photoButton = document.getElementById("photoButton");
const photoChoice = document.getElementById("photoChoice");
const cameraButton = document.getElementById("cameraButton");
const galleryButton = document.getElementById("galleryButton");
const cameraInput = document.getElementById("cameraInput");
const galleryInput = document.getElementById("galleryInput");
const photoWindow = document.getElementById("photoWindow");
const photoPlaceholder = document.getElementById("photoPlaceholder");
const userPhoto = document.getElementById("userPhoto");
const zoomSlider = document.getElementById("zoomSlider");
const templateImage = document.getElementById("templateImage");
const generateButton = document.getElementById("generateButton");
const shareButton = document.getElementById("shareButton");
const downloadMessage = document.getElementById("downloadMessage");


/* ==========================================
   Apply template and photo-window configuration
========================================== */

// Keep the original artwork for the final composite, and create a transparent
// overlay by removing the gray photo mat from the frame artwork at runtime.
const baseTemplateImage = new Image();
baseTemplateImage.src = TEMPLATE_CONFIG.image;

function prepareTransparentOverlay() {
  if (!baseTemplateImage.complete || !baseTemplateImage.naturalWidth) return;
  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.width = baseTemplateImage.naturalWidth;
  overlayCanvas.height = baseTemplateImage.naturalHeight;
  const overlayCtx = overlayCanvas.getContext("2d");
  overlayCtx.drawImage(baseTemplateImage, 0, 0);

  const aperture = TEMPLATE_CONFIG.photoArea;
  const points = aperture.clipPoints;
  const bleed = 2.5;
  const overlayPoints = [
    [points[0][0] - bleed, points[0][1] + bleed],
    [points[1][0] + bleed, points[1][1] - bleed],
    [points[2][0] + bleed, points[2][1] + bleed],
    [points[3][0] - bleed, points[3][1] + bleed]
  ];
  overlayCtx.save();
  overlayCtx.globalCompositeOperation = "destination-out";
  overlayCtx.beginPath();
  overlayPoints.forEach(function (point, index) {
    const x = (aperture.left + aperture.width * point[0] / 100) * overlayCanvas.width / 100;
    const y = (aperture.top + aperture.height * point[1] / 100) * overlayCanvas.height / 100;
    if (index === 0) overlayCtx.moveTo(x, y);
    else overlayCtx.lineTo(x, y);
  });
  overlayCtx.closePath();
  overlayCtx.fill();
  overlayCtx.restore();
  templateImage.src = overlayCanvas.toDataURL("image/png");
}

// An Image can report complete=true before a source has finished loading
// (or when it has no decoded dimensions). Only prepare immediately when the
// actual image is ready; otherwise wait for its load event.
if (baseTemplateImage.complete && baseTemplateImage.naturalWidth > 0) {
  prepareTransparentOverlay();
} else {
  baseTemplateImage.addEventListener("load", prepareTransparentOverlay, { once: true });
  baseTemplateImage.addEventListener("error", function () {
    console.error("Unable to load the Dussehra template artwork.");
  }, { once: true });
}

photoWindow.style.left = TEMPLATE_CONFIG.photoArea.left + "%";
photoWindow.style.top = TEMPLATE_CONFIG.photoArea.top + "%";
photoWindow.style.width = TEMPLATE_CONFIG.photoArea.width + "%";
photoWindow.style.height = TEMPLATE_CONFIG.photoArea.height + "%";

const previewBleed = 2.5;
const previewPoints = [
  [TEMPLATE_CONFIG.photoArea.clipPoints[0][0] - previewBleed, TEMPLATE_CONFIG.photoArea.clipPoints[0][1] + previewBleed],
  [TEMPLATE_CONFIG.photoArea.clipPoints[1][0] + previewBleed, TEMPLATE_CONFIG.photoArea.clipPoints[1][1] - previewBleed],
  [TEMPLATE_CONFIG.photoArea.clipPoints[2][0] + previewBleed, TEMPLATE_CONFIG.photoArea.clipPoints[2][1] + previewBleed],
  [TEMPLATE_CONFIG.photoArea.clipPoints[3][0] - previewBleed, TEMPLATE_CONFIG.photoArea.clipPoints[3][1] + previewBleed]
];
const apertureClip = "polygon(" +
  previewPoints
    .map(function (point) {
      return point[0] + "% " + point[1] + "%";
    })
    .join(", ") +
  ")";

// Clip the photo to the inner edge of the frame. It sits above the gray
// placeholder/mat in the template, while the polygon keeps it off the paper.
photoWindow.style.clipPath = apertureClip;
photoWindow.style.webkitClipPath = apertureClip;


/* ==========================================
   Photo state
========================================== */

let imageLoaded = false;
let baseScale = 1;
let zoom = 1;
let photoX = 0;
let photoY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let photoStartX = 0;
let photoStartY = 0;


/* ==========================================
   Photo selection menu
========================================== */

photoButton.addEventListener("click", function () {
  photoChoice.hidden = !photoChoice.hidden;
});

cameraButton.addEventListener("click", function () {
  cameraInput.click();
});

galleryButton.addEventListener("click", function () {
  galleryInput.click();
});


/* ==========================================
   Handle selected photo
========================================== */

function handlePhotoSelection(event) {
  const file = event.target.files && event.target.files[0];

  // Reset the input so selecting the same file again triggers change.
  event.target.value = "";

  if (!file) {
    return;
  }

  if (!file.type || !file.type.startsWith("image/")) {
    downloadMessage.textContent = "Please select an image file.";
    return;
  }

  photoChoice.hidden = true;

  const imageURL = URL.createObjectURL(file);
  photoPlaceholder.style.display = "none";
  generateButton.disabled = true;
  shareButton.disabled = true;

  userPhoto.onload = function () {
    imageLoaded = true;
    userPhoto.style.display = "block";
    generateButton.disabled = false;
    shareButton.disabled = false;
    downloadMessage.textContent = "";
    setupPhoto();
    URL.revokeObjectURL(imageURL);
  };

  userPhoto.onerror = function () {
    imageLoaded = false;
    userPhoto.style.display = "none";
    photoPlaceholder.style.display = "flex";
    generateButton.disabled = true;
    shareButton.disabled = true;
    downloadMessage.textContent = "Unable to load that photo. Please try another.";
    URL.revokeObjectURL(imageURL);
  };

  userPhoto.src = imageURL;
}

cameraInput.addEventListener("change", handlePhotoSelection);
galleryInput.addEventListener("change", handlePhotoSelection);


/* ==========================================
   Setup photo to cover the photo aperture
========================================== */

function setupPhoto() {
  const viewportWidth = photoWindow.clientWidth;
  const viewportHeight = photoWindow.clientHeight;
  const imageWidth = userPhoto.naturalWidth;
  const imageHeight = userPhoto.naturalHeight;

  if (!viewportWidth || !viewportHeight || !imageWidth || !imageHeight) {
    return;
  }

  const scaleX = viewportWidth / imageWidth;
  const scaleY = viewportHeight / imageHeight;

  // Fill the full aperture bounds; the tilted polygon clips the corners.
  baseScale = Math.max(scaleX, scaleY);
  zoom = 1;
  photoX = 0;
  photoY = 0;
  zoomSlider.value = "1";
  updatePhoto();
}


/* ==========================================
   Update photo position and zoom
========================================== */

function updatePhoto() {
  if (!imageLoaded) {
    return;
  }

  const scale = baseScale * zoom;

  userPhoto.style.transform =
    "translate(calc(-50% + " + photoX + "px), calc(-50% + " +
    photoY + "px)) scale(" + scale + ")";
}

zoomSlider.addEventListener("input", function () {
  zoom = Number(zoomSlider.value);
  updatePhoto();
});


/* ==========================================
   Drag controls
========================================== */

photoWindow.addEventListener("pointerdown", function (event) {
  if (!imageLoaded) {
    return;
  }

  isDragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  photoStartX = photoX;
  photoStartY = photoY;

  if (photoWindow.setPointerCapture) {
    photoWindow.setPointerCapture(event.pointerId);
  }

  photoWindow.style.cursor = "grabbing";
});

photoWindow.addEventListener("pointermove", function (event) {
  if (!isDragging) {
    return;
  }

  photoX = photoStartX + (event.clientX - dragStartX);
  photoY = photoStartY + (event.clientY - dragStartY);
  updatePhoto();
});

function stopDragging(event) {
  isDragging = false;
  photoWindow.style.cursor = "grab";

  if (
    event &&
    photoWindow.hasPointerCapture &&
    photoWindow.hasPointerCapture(event.pointerId)
  ) {
    photoWindow.releasePointerCapture(event.pointerId);
  }
}

photoWindow.addEventListener("pointerup", stopDragging);
photoWindow.addEventListener("pointercancel", stopDragging);
photoWindow.addEventListener("lostpointercapture", function () {
  isDragging = false;
  photoWindow.style.cursor = "grab";
});


/* ==========================================
   Generate final PNG
   Draw photo FIRST, clipped to the aperture.
   Draw the transparent template LAST so the
   frame, torn paper, and tape sit ABOVE the photo.
========================================== */

async function generateGraphic() {
  if (!imageLoaded) {
    throw new Error("No photo has been selected.");
  }

  if (!templateImage.complete || !templateImage.naturalWidth) {
    await new Promise(function (resolve, reject) {
      templateImage.addEventListener("load", resolve, { once: true });
      templateImage.addEventListener("error", function () {
        reject(new Error("Unable to load the template image."));
      }, { once: true });
    });
  }

  const template = templateImage;
  const canvas = document.createElement("canvas");

  canvas.width = template.naturalWidth;
  canvas.height = template.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not available in this browser.");
  }

  const templateRect = template.getBoundingClientRect();
  const windowRect = photoWindow.getBoundingClientRect();
  const scaleFactor = template.naturalWidth / templateRect.width;

  const photoAreaX = (windowRect.left - templateRect.left) * scaleFactor;
  const photoAreaY = (windowRect.top - templateRect.top) * scaleFactor;
  const photoAreaWidth = windowRect.width * scaleFactor;
  const photoAreaHeight = windowRect.height * scaleFactor;

  const photoAreaCenterX = photoAreaX + photoAreaWidth / 2;
  const photoAreaCenterY = photoAreaY + photoAreaHeight / 2;

  const finalScale = baseScale * zoom * scaleFactor;
  const finalPhotoWidth = userPhoto.naturalWidth * finalScale;
  const finalPhotoHeight = userPhoto.naturalHeight * finalScale;

  const translatedX = photoX * scaleFactor;
  const translatedY = photoY * scaleFactor;

  const photoDrawX = photoAreaCenterX - finalPhotoWidth / 2 + translatedX;
  const photoDrawY = photoAreaCenterY - finalPhotoHeight / 2 + translatedY;

  // Composite in three layers: original artwork, photo extending under the frame,
  // then the transparent frame/tape overlay created above.
  ctx.drawImage(baseTemplateImage, 0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  const points = TEMPLATE_CONFIG.photoArea.clipPoints;
  // Extend the photo slightly beneath the paper edges to prevent gray seams.
  const bleed = 2.5;
  const expandedPoints = [
    [points[0][0] - bleed, points[0][1] + bleed],
    [points[1][0] + bleed, points[1][1] - bleed],
    [points[2][0] + bleed, points[2][1] + bleed],
    [points[3][0] - bleed, points[3][1] + bleed]
  ];
  expandedPoints.forEach(function (point, index) {
    const x = photoAreaX + photoAreaWidth * (point[0] / 100);
    const y = photoAreaY + photoAreaHeight * (point[1] / 100);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    userPhoto,
    photoDrawX,
    photoDrawY,
    finalPhotoWidth,
    finalPhotoHeight
  );

  ctx.restore();

  // Paint the prepared transparent overlay last so the paper frame and tape sit above the photo.
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) {
      if (!blob) {
        reject(new Error("Unable to create the PNG image."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}


/* ==========================================
   Download
========================================== */

generateButton.addEventListener("click", async function () {
  if (!imageLoaded) {
    return;
  }

  generateButton.disabled = true;
  downloadMessage.textContent = "Creating your graphic...";

  try {
    const blob = await generateGraphic();
    const downloadURL = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadURL;
    link.download = "eoe-jaipur-dussehra-photo.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(function () {
      URL.revokeObjectURL(downloadURL);
    }, 1500);

    downloadMessage.textContent = "Your graphic is ready.";
  } catch (error) {
    console.error("Download error:", error);
    downloadMessage.textContent = "Something went wrong. Please try again.";
  } finally {
    generateButton.disabled = !imageLoaded;
  }
});


/* ==========================================
   Share — generates the image independently
========================================== */

shareButton.addEventListener("click", async function () {
  if (!imageLoaded) {
    return;
  }

  shareButton.disabled = true;
  downloadMessage.textContent = "Preparing your graphic...";

  try {
    const blob = await generateGraphic();
    const file = new File(
      [blob],
      "eoe-jaipur-dussehra-photo.png",
      { type: "image/png" }
    );

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: "Sadhguru in Jaipur — 10 January 2027",
        text: "✨ I am going to Jaipur on 10 Jan 2027 to be a part of Soak in Ecstasy of Enlightenment with Sadhguru! 🙏🌸"
      });

      downloadMessage.textContent = "Graphic shared.";
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: "Sadhguru in Jaipur — 10 January 2027",
        text: "✨ I am going to Jaipur on 10 Jan 2027 to be a part of Soak in Ecstasy of Enlightenment with Sadhguru! 🙏🌸",
        url: window.location.href
      });

      downloadMessage.textContent = "Share completed.";
      return;
    }

    // For browsers without native sharing, download the generated PNG.
    const downloadURL = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadURL;
    link.download = "eoe-jaipur-dussehra-photo.png";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(function () {
      URL.revokeObjectURL(downloadURL);
    }, 1500);

    downloadMessage.textContent = "Image downloaded. Share it from your photos.";
  } catch (error) {
    if (error && error.name === "AbortError") {
      downloadMessage.textContent = "";
      return;
    }

    console.error("Share error:", error);
    downloadMessage.textContent = "Unable to share. Please try again.";
  } finally {
    shareButton.disabled = !imageLoaded;
  }
});
