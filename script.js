/* ==========================================
   TEMPLATE CONFIGURATION
   Change ONLY this section when you create
   a new graphic.
========================================== */

const TEMPLATE_CONFIG = {
  image: "assets/eoe-template.png",

  photoArea: {
    left: 51,
    top: 41,
    width: 30,

    // Available:
    // "circle"
    // "square"
    // "rounded"
    shape: "circle"
  }
};


/* ==========================================
   App elements
========================================== */

const photoButton = document.getElementById("photoButton");
const photoInput = document.getElementById("photoInput");

const photoWindow = document.getElementById("photoWindow");
const photoPlaceholder = document.getElementById("photoPlaceholder");
const userPhoto = document.getElementById("userPhoto");

const zoomSlider = document.getElementById("zoomSlider");

const templateImage = document.getElementById("templateImage");

const generateButton = document.getElementById("generateButton");
const downloadMessage = document.getElementById("downloadMessage");


/* ==========================================
   Apply template configuration
========================================== */

templateImage.src = TEMPLATE_CONFIG.image;

photoWindow.style.left =
  `${TEMPLATE_CONFIG.photoArea.left}%`;

photoWindow.style.top =
  `${TEMPLATE_CONFIG.photoArea.top}%`;

photoWindow.style.width =
  `${TEMPLATE_CONFIG.photoArea.width}%`;


/* ==========================================
   Photo shape
========================================== */

function applyPhotoShape() {

  const shape =
    TEMPLATE_CONFIG.photoArea.shape;

  if (shape === "circle") {
    photoWindow.style.borderRadius = "50%";
  }

  if (shape === "square") {
    photoWindow.style.borderRadius = "0";
  }

  if (shape === "rounded") {
    photoWindow.style.borderRadius = "16%";
  }

}

applyPhotoShape();


/* ==========================================
   Photo state
========================================== */

let imageLoaded = false;

let baseScale = 1;
let zoom = 1;

let photoX = 0;
let photoY = 0;


/* ==========================================
   Drag state
========================================== */

let isDragging = false;

let dragStartX = 0;
let dragStartY = 0;

let photoStartX = 0;
let photoStartY = 0;


/* ==========================================
   Open camera / file picker
========================================== */

photoButton.addEventListener("click", () => {
  photoInput.click();
});


/* ==========================================
   Photo selected
========================================== */

photoInput.addEventListener("change", (event) => {

  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const imageURL =
    URL.createObjectURL(file);

  photoPlaceholder.style.display =
    "none";

  userPhoto.onload = () => {

    imageLoaded = true;

    userPhoto.style.display =
      "block";

    generateButton.disabled =
      false;

    setupPhoto();

    URL.revokeObjectURL(imageURL);

  };

  userPhoto.onerror = () => {

    imageLoaded = false;

    userPhoto.style.display =
      "none";

    photoPlaceholder.style.display =
      "flex";

    generateButton.disabled =
      true;

    console.error(
      "Unable to load the selected image."
    );

  };

  userPhoto.src =
    imageURL;

});


/* ==========================================
   Initial photo setup
========================================== */

function setupPhoto() {

  const viewportWidth =
    photoWindow.clientWidth;

  const viewportHeight =
    photoWindow.clientHeight;

  const imageWidth =
    userPhoto.naturalWidth;

  const imageHeight =
    userPhoto.naturalHeight;

  const scaleX =
    viewportWidth / imageWidth;

  const scaleY =
    viewportHeight / imageHeight;

  baseScale =
    Math.max(scaleX, scaleY);

  zoom = 1;

  photoX = 0;
  photoY = 0;

  zoomSlider.value = 1;

  updatePhoto();

}


/* ==========================================
   Update photo
========================================== */

function updatePhoto() {

  if (!imageLoaded) {
    return;
  }

  const scale =
    baseScale * zoom;

  userPhoto.style.transform =
    `
      translate(
        calc(-50% + ${photoX}px),
        calc(-50% + ${photoY}px)
      )
      scale(${scale})
    `;
}


/* ==========================================
   Zoom
========================================== */

zoomSlider.addEventListener("input", () => {

  zoom =
    Number(zoomSlider.value);

  updatePhoto();

});


/* ==========================================
   Start dragging
========================================== */

photoWindow.addEventListener(
  "pointerdown",
  (event) => {

    if (!imageLoaded) {
      return;
    }

    isDragging = true;

    dragStartX =
      event.clientX;

    dragStartY =
      event.clientY;

    photoStartX =
      photoX;

    photoStartY =
      photoY;

    photoWindow.setPointerCapture(
      event.pointerId
    );

    photoWindow.style.cursor =
      "grabbing";

  }
);


/* ==========================================
   Dragging
========================================== */

photoWindow.addEventListener(
  "pointermove",
  (event) => {

    if (!isDragging) {
      return;
    }

    const deltaX =
      event.clientX -
      dragStartX;

    const deltaY =
      event.clientY -
      dragStartY;

    photoX =
      photoStartX +
      deltaX;

    photoY =
      photoStartY +
      deltaY;

    updatePhoto();

  }
);


/* ==========================================
   Stop dragging
========================================== */

photoWindow.addEventListener(
  "pointerup",
  (event) => {

    isDragging = false;

    photoWindow.style.cursor =
      "grab";

    if (
      photoWindow.hasPointerCapture(
        event.pointerId
      )
    ) {

      photoWindow.releasePointerCapture(
        event.pointerId
      );

    }

  }
);


/* ==========================================
   Pointer cancelled
========================================== */

photoWindow.addEventListener(
  "pointercancel",
  () => {

    isDragging = false;

    photoWindow.style.cursor =
      "grab";

  }
);


/* ==========================================
   Generate final PNG
========================================== */

generateButton.addEventListener(
  "click",
  async () => {

    if (!imageLoaded) {
      return;
    }

    downloadMessage.textContent =
      "Creating your graphic...";

    try {

      const template =
        templateImage;

      const canvas =
        document.createElement("canvas");

      canvas.width =
        template.naturalWidth;

      canvas.height =
        template.naturalHeight;

      const ctx =
        canvas.getContext("2d");


      /*
        Draw artwork
      */

      ctx.drawImage(
        template,
        0,
        0
      );


      /*
        Calculate display → original
        template scaling
      */

      const templateRect =
        template.getBoundingClientRect();

      const windowRect =
        photoWindow.getBoundingClientRect();

      const scaleFactor =
        template.naturalWidth /
        templateRect.width;


      /*
        Photo area position
      */

      const photoAreaX =
        (windowRect.left -
          templateRect.left) *
        scaleFactor;

      const photoAreaY =
        (windowRect.top -
          templateRect.top) *
        scaleFactor;

      const photoAreaWidth =
        windowRect.width *
        scaleFactor;

      const photoAreaHeight =
        windowRect.height *
        scaleFactor;


      const photoAreaCenterX =
        photoAreaX +
        photoAreaWidth / 2;

      const photoAreaCenterY =
        photoAreaY +
        photoAreaHeight / 2;


      /*
        Photo size
      */

      const finalScale =
        baseScale *
        zoom *
        scaleFactor;

      const finalPhotoWidth =
        userPhoto.naturalWidth *
        finalScale;

      const finalPhotoHeight =
        userPhoto.naturalHeight *
        finalScale;


      const translatedX =
        photoX *
        scaleFactor;

      const translatedY =
        photoY *
        scaleFactor;


      const photoDrawX =
        photoAreaCenterX -
        finalPhotoWidth / 2 +
        translatedX;

      const photoDrawY =
        photoAreaCenterY -
        finalPhotoHeight / 2 +
        translatedY;


      /*
        Clip the photo
      */

      ctx.save();

      ctx.beginPath();

      const shape =
        TEMPLATE_CONFIG.photoArea.shape;

      if (shape === "circle") {

        ctx.arc(
          photoAreaCenterX,
          photoAreaCenterY,
          photoAreaWidth / 2,
          0,
          Math.PI * 2
        );

      } else if (shape === "square") {

        ctx.rect(
          photoAreaX,
          photoAreaY,
          photoAreaWidth,
          photoAreaHeight
        );

      } else if (shape === "rounded") {

        const radius =
          photoAreaWidth * 0.16;

        ctx.roundRect(
          photoAreaX,
          photoAreaY,
          photoAreaWidth,
          photoAreaHeight,
          radius
        );

      }

      ctx.clip();


      /*
        Draw user's photo
      */

      ctx.drawImage(
        userPhoto,
        photoDrawX,
        photoDrawY,
        finalPhotoWidth,
        finalPhotoHeight
      );

      ctx.restore();


      /*
        Create PNG
      */

      canvas.toBlob(
        (blob) => {

          if (!blob) {

            downloadMessage.textContent =
              "Unable to create the image.";

            return;

          }

          const downloadURL =
            URL.createObjectURL(blob);

          const link =
            document.createElement("a");

          link.href =
            downloadURL;

          link.download =
            "eoe-jaipur-my-photo.png";

          document.body.appendChild(link);

          link.click();

          link.remove();

          URL.revokeObjectURL(
            downloadURL
          );

          downloadMessage.textContent =
            "Your graphic is ready.";

        },
        "image/png"
      );

    } catch (error) {

      console.error(
        "Image generation error:",
        error
      );

      downloadMessage.textContent =
        "Something went wrong. Please try again.";

    }

  }
);
