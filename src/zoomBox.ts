import { CallbackProperty, Cartographic, Color, Ellipsoid, KeyboardEventModifier, Rectangle, ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer } from 'cesium'

export const enableZoomBox = (viewer: Viewer) => {
    if (!viewer) return { destroy: () => {} };
    let zoomBox;
    const rectangleSelector = new Rectangle();
    const screenSpaceEventHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    let tempCartographic = new Cartographic();
    const firstPoint = new Cartographic();
    let firstPointSet = false;
    let mouseDown = false;
    const camera = viewer.camera;

    const getZoomBoxLocation = new CallbackProperty((_time, result) => {
        return Rectangle.clone(rectangleSelector, result);
    }, false);

    // Start drawing
    screenSpaceEventHandler.setInputAction(() => {
    mouseDown = true;
    firstPointSet = false;

    // Disable default Cesium camera controls
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableInputs = false;

    // Bind rectangle to live-updating callback
    zoomBox.rectangle.coordinates = getZoomBoxLocation;
    viewer.scene.requestRender();
    }, ScreenSpaceEventType.LEFT_DOWN, KeyboardEventModifier.ALT);

    //Draw the selector while the user drags the mouse while holding shift
    screenSpaceEventHandler.setInputAction((movement) => {
    if (!mouseDown) return;

    const cartesian = camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
    if (cartesian) {
        tempCartographic = Cartographic.fromCartesian(cartesian, Ellipsoid.WGS84, tempCartographic);

        if (!firstPointSet) {
        Cartographic.clone(tempCartographic, firstPoint);
        firstPointSet = true;
        } else {
        rectangleSelector.east = Math.max(tempCartographic.longitude, firstPoint.longitude);
        rectangleSelector.west = Math.min(tempCartographic.longitude, firstPoint.longitude);
        rectangleSelector.north = Math.max(tempCartographic.latitude, firstPoint.latitude);
        rectangleSelector.south = Math.min(tempCartographic.latitude, firstPoint.latitude);
        zoomBox.show = true;
        viewer.scene.requestRender();
        }
    }
    }, ScreenSpaceEventType.MOUSE_MOVE, KeyboardEventModifier.ALT);

    const finalizeRectangle = () => {
    mouseDown = false;
    firstPointSet = false;

    // Re-enable camera input
    viewer.scene.screenSpaceCameraController.enableInputs = true;

    // Finalize rectangle
    zoomBox.rectangle.coordinates = rectangleSelector;

    // Zoom to rectangle if valid
    if (
        rectangleSelector.west !== rectangleSelector.east &&
        rectangleSelector.south !== rectangleSelector.north
    ) {
        viewer.camera.flyTo({
        destination: rectangleSelector,
        duration: 0.5,
        complete: () => {
            zoomBox.show = false;
        }
        });
    } else {
        zoomBox.show = false;
    }
    }

    // Finish drawing
    screenSpaceEventHandler.setInputAction(finalizeRectangle, ScreenSpaceEventType.LEFT_UP, KeyboardEventModifier.ALT);

    // If alt is released before mouse up
    screenSpaceEventHandler.setInputAction(() => {
        if (mouseDown) {
        finalizeRectangle();
        }
    },
    ScreenSpaceEventType.LEFT_UP
    );

    //Hide the selector by clicking anywhere
    screenSpaceEventHandler.setInputAction(() => {
        zoomBox.show = false;
        mouseDown = false;
        firstPointSet = false;
    }, ScreenSpaceEventType.LEFT_CLICK);


    zoomBox = viewer.entities.add({
        show: false,
        rectangle: {
            coordinates: getZoomBoxLocation,
            material: Color.BLUE.withAlpha(0.5)
        }
    });

  return {
    destroy: () => {
      screenSpaceEventHandler.destroy();
      if (viewer && viewer.entities && zoomBox && viewer.entities.contains(zoomBox)) viewer.entities.remove(zoomBox);
    },
  };

}