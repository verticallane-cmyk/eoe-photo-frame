const photoButton = document.getElementById("photoButton");
const photoInput = document.getElementById("photoInput");

const photoWindow = document.getElementById("photoWindow");
const photoPlaceholder = document.getElementById("photoPlaceholder");
const userPhoto = document.getElementById("userPhoto");

const zoomSlider = document.getElementById("zoomSlider");

const templateImage = document.getElementById("templateImage");

const generateButton = document.getElementById("generateButton");
const downloadMessage = document.getElementById("downloadMessage");


/* --------------------------------
   Photo state
-------------------------------- */

let imageLoaded = false;

let baseScale = 1;
let zoom = 1;

let photoX = 0;
let photoY = 0;


/* --------------------------------
   Drag state
-------------------------------- */

let isDragging = false;

let dragStartX = 0;
let dragStartY = 0;

let photoStartX = 0;
let photoStartY = 0;


/* --------------------------------
   Open camera / file picker
-------------------------------- */

photoButton.addEventListener("click", () => {
  photoInput.click();
});


/* --------------------------------
   Photo selected
-------------------------------- */

photoInput.addEventListener("change", (event) => {

  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const imageURL = URL.createObjectURL(file);

  photoPlaceholder.style.display = "none";

  userPhoto.onload = () => {

    imageLoaded = true;

    userPhoto.style.display = "block";

    generateButton.disabled = false;

    setupPhoto();

    URL.revokeObjectURL(imageURL);

  };

  userPhoto.onerror = () => {

    imageLoaded = false;

    userPhoto.style.display = "none";

    photoPlaceholder.style.display = "flex";

    generateButton.disabled = true;

  };

  userPhoto.src = imageURL;

});


/* --------------------------------
   Setup photo
-------------------------------- */

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


/* --------------------------------
   Update photo position
-------------------------------- */

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


/* --------------------------------
   Zoom
-------------------------------- */

zoomSlider.addEventListener("input", () => {

  zoom =
    Number(zoomSlider.value);

  updatePhoto();

});


/* --------------------------------
   Start dragging
-------------------------------- */

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


/* --------------------------------
   Drag
-------------------------------- */

photoWindow.addEventListener(
  "pointermove",
  (event) => {

    if (!isDragging) {
      return;
    }

    const deltaX =
      event.clientX - dragStartX;

    const deltaY =
      event.clientY - dragStartY;

    photoX =
      photoStartX + deltaX;

    photoY =
      photoStartY + deltaY;

    updatePhoto();

  }
);


/* --------------------------------
   Stop dragging
-------------------------------- */

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


/* --------------------------------
   Pointer cancelled
-------------------------------- */

photoWindow.addEventListener(
  "pointercancel",
  () => {

    isDragging = false;

    photoWindow.style.cursor =
      "grab";

  }
);


/* --------------------------------
   Generate final PNG
-------------------------------- */

generateButton.addEventListener(
  "click",
  async () => {

    if (!imageLoaded) {
      return;
    }

    downloadMessage.textContent =
      "Creating your graphic...";

    try {

      /*
        Use the already-loaded template
        image rather than loading it again.
      */

      const template =
        templateImage;


      /*
        Create canvas at the
        original template dimensions.
      */

      const canvas =
        document.createElement("canvas");

      canvas.width =
        template.naturalWidth;

      canvas.height =
        template.naturalHeight;

      const ctx =
        canvas.getContext("2d");


      /*
        Draw background artwork.
      */

      ctx.drawImage(
        template,
        0,
        0
      );


      /*
        Determine how the displayed
        artwork maps to its original size.
      */

      const templateRect =
        template.getBoundingClientRect();

      const windowRect =
        photoWindow.getBoundingClientRect();


      const scaleFactor =
        template.naturalWidth /
        templateRect.width;


      /*
        Circle position in original
        template pixels.
      */

      const circleX =
        (windowRect.left -
          templateRect.left) *
        scaleFactor;

      const circleY =
        (windowRect.top -
          templateRect.top) *
        scaleFactor;

      const circleSize =
        windowRect.width *
        scaleFactor;


      const circleCenterX =
        circleX +
        circleSize / 2;

      const circleCenterY =
        circleY +
        circleSize / 2;


      /*
        Calculate final photo size.
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
        Convert user's drag movement
        to original template pixels.
      */

      const translatedX =
        photoX *
        scaleFactor;

      const translatedY =
        photoY *
        scaleFactor;


      const photoDrawX =
        circleCenterX -
        finalPhotoWidth / 2 +
        translatedX;

      const photoDrawY =
        circleCenterY -
        finalPhotoHeight / 2 +
        translatedY;


      /*
        Clip to circle.
      */

      ctx.save();

      ctx.beginPath();

      ctx.arc(
        circleCenterX,
        circleCenterY,
        circleSize / 2,
        0,
        Math.PI * 2
      );

      ctx.clip();


      /*
        Draw user photo.
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
        Convert canvas to PNG.
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