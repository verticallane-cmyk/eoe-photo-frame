/* ==========================================
   TEMPLATE CONFIGURATION
========================================== */

const TEMPLATE_CONFIG = {
  image: "assets/eoe-template.png",

  photoArea: {
    left: 10.7,
    top: 38,
    width: 37,

    // "circle"
    // "square"
    // "rounded"
    shape: "circle"
  }
};


/* ==========================================
   App elements
========================================== */

const photoButton =
  document.getElementById("photoButton");

const photoChoice =
  document.getElementById("photoChoice");

const cameraButton =
  document.getElementById("cameraButton");

const galleryButton =
  document.getElementById("galleryButton");

const cameraInput =
  document.getElementById("cameraInput");

const galleryInput =
  document.getElementById("galleryInput");

const photoWindow =
  document.getElementById("photoWindow");

const photoPlaceholder =
  document.getElementById("photoPlaceholder");

const userPhoto =
  document.getElementById("userPhoto");

const zoomSlider =
  document.getElementById("zoomSlider");

const templateImage =
  document.getElementById("templateImage");

const generateButton =
  document.getElementById("generateButton");

const shareButton =
  document.getElementById("shareButton");

const downloadMessage =
  document.getElementById("downloadMessage");


/* ==========================================
   Apply template configuration
========================================== */

templateImage.src =
  TEMPLATE_CONFIG.image;

photoWindow.style.left =
  `${TEMPLATE_CONFIG.photoArea.left}%`;

photoWindow.style.top =
  `${TEMPLATE_CONFIG.photoArea.top}%`;

photoWindow.style.width =
  `${TEMPLATE_CONFIG.photoArea.width}%`;


/* ==========================================
   Apply photo shape
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
   Generated image
========================================== */

let generatedBlob = null;


/* ==========================================
   Drag state
========================================== */

let isDragging = false;

let dragStartX = 0;
let dragStartY = 0;

let photoStartX = 0;
let photoStartY = 0;


/* ==========================================
   Open photo selection menu
========================================== */

photoButton.addEventListener("click", () => {

  photoChoice.hidden =
    !photoChoice.hidden;

});


/* ==========================================
   Open camera
========================================== */

cameraButton.addEventListener("click", () => {

  cameraInput.click();

});


/* ==========================================
   Open gallery
========================================== */

galleryButton.addEventListener("click", () => {

  galleryInput.click();

});


/* ==========================================
   Handle selected photo
========================================== */

function handlePhotoSelection(event) {

  const file =
    event.target.files[0];

  if (!file) {
    return;
  }


  photoChoice.hidden =
    true;

  generatedBlob =
    null;

  shareButton.disabled =
    true;


  const imageURL =
    URL.createObjectURL(file);


  photoPlaceholder.style.display =
    "none";


  userPhoto.onload = () => {

    imageLoaded =
      true;

    userPhoto.style.display =
      "block";

    generateButton.disabled =
      false;

    setupPhoto();

    URL.revokeObjectURL(
      imageURL
    );

  };


  userPhoto.onerror = () => {

    imageLoaded =
      false;

    userPhoto.style.display =
      "none";

    photoPlaceholder.style.display =
      "flex";

    generateButton.disabled =
      true;

    shareButton.disabled =
      true;

    URL.revokeObjectURL(
      imageURL
    );

  };


  userPhoto.src =
    imageURL;

}


/* ==========================================
   Connect both inputs
========================================== */

cameraInput.addEventListener(
  "change",
  handlePhotoSelection
);

galleryInput.addEventListener(
  "change",
  handlePhotoSelection
);


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
    viewportWidth /
    imageWidth;

  const scaleY =
    viewportHeight /
    imageHeight;


  baseScale =
    Math.max(
      scaleX,
      scaleY
    );


  zoom =
    1;

  photoX =
    0;

  photoY =
    0;


  zoomSlider.value =
    1;


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

zoomSlider.addEventListener(
  "input",
  () => {

    zoom =
      Number(
        zoomSlider.value
      );

    updatePhoto();

  }
);


/* ==========================================
   Start dragging
========================================== */

photoWindow.addEventListener(
  "pointerdown",
  (event) => {

    if (!imageLoaded) {
      return;
    }


    isDragging =
      true;


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

    isDragging =
      false;


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

    isDragging =
      false;

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


    shareButton.disabled =
      true;


    try {

      const template =
        templateImage;


      const canvas =
        document.createElement("canvas");


      /*
        Preserve original artwork
        dimensions.
      */

      canvas.width =
        template.naturalWidth;

      canvas.height =
        template.naturalHeight;


      const ctx =
        canvas.getContext("2d");


      /*
        Draw template.
      */

      ctx.drawImage(
        template,
        0,
        0
      );


      /*
        Displayed dimensions.
      */

      const templateRect =
        template.getBoundingClientRect();

      const windowRect =
        photoWindow.getBoundingClientRect();


      /*
        Convert screen pixels into
        original artwork pixels.
      */

      const scaleFactor =
        template.naturalWidth /
        templateRect.width;


      /*
        Photo area.
      */

      const photoAreaX =
        (
          windowRect.left -
          templateRect.left
        ) *
        scaleFactor;


      const photoAreaY =
        (
          windowRect.top -
          templateRect.top
        ) *
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
        Calculate photo scale.
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


      /*
        Convert drag movement.
      */

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
        Clip photo to configured shape.
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

      }


      else if (shape === "square") {

        ctx.rect(
          photoAreaX,
          photoAreaY,
          photoAreaWidth,
          photoAreaHeight
        );

      }


      else if (shape === "rounded") {

        const radius =
          photoAreaWidth *
          0.16;


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
        Draw user's photo.
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
        Convert canvas to PNG blob.
      */

      canvas.toBlob(
        async (blob) => {

          if (!blob) {

            downloadMessage.textContent =
              "Unable to create the image.";

            return;

          }


          generatedBlob =
            blob;


          /*
            Download automatically.
          */

          const downloadURL =
            URL.createObjectURL(
              blob
            );


          const link =
            document.createElement("a");


          link.href =
            downloadURL;


          link.download =
            "eoe-jaipur-my-photo.png";


          document.body.appendChild(
            link
          );


          link.click();


          link.remove();


          URL.revokeObjectURL(
            downloadURL
          );


          /*
            Enable Share.
          */

          shareButton.disabled =
            false;


          downloadMessage.textContent =
            "Your graphic is ready.";

        },
        "image/png"
      );

    }


    catch (error) {

      console.error(
        "Image generation error:",
        error
      );


      downloadMessage.textContent =
        "Something went wrong. Please try again.";

    }

  }
);


/* ==========================================
   Share generated graphic
========================================== */

shareButton.addEventListener(
  "click",
  async () => {

    if (!generatedBlob) {
      return;
    }


    /*
      Convert the generated PNG into
      a shareable file.
    */

    const file =
      new File(
        [generatedBlob],
        "eoe-jaipur-my-photo.png",
        {
          type: "image/png"
        }
      );


    /*
      Use the native phone share sheet
      when the browser supports sharing
      image files.
    */

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [file]
      })
    ) {

      try {

        await navigator.share({
          files: [file],
          title:
            "Soak in Ecstasy of Enlightenment with Sadhguru",
          text:
            "I am going! Jaipur — 10 January 2027"
        });

      }

      catch (error) {

        /*
          User cancelled the share sheet.
          Do not show an error for that.
        */

        if (
          error.name !==
          "AbortError"
        ) {

          console.error(
            "Share failed:",
            error
          );

        }

      }

      return;
    }


    /*
      Fallback for browsers that don't
      support sharing image files.
    */

    if (navigator.share) {

      try {

        await navigator.share({
          title:
            "Soak in Ecstasy of Enlightenment with Sadhguru",
          text:
            "I am going! Jaipur — 10 January 2027",
          url:
            window.location.href
        });

      }

      catch (error) {

        if (
          error.name !==
          "AbortError"
        ) {

          console.error(
            "Share failed:",
            error
          );

        }

      }

      return;
    }


    /*
      Desktop / unsupported browser.
    */

    downloadMessage.textContent =
      "Sharing is available on supported mobile devices.";

  }
);
