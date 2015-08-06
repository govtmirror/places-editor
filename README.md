# Places Editor - a fork of [iD](https://github.com/openstreetmap/id), OpenStreetMap's friendly JavaScript editor, customized for use in the National Park Service's [Places](http://www.nps.gov/tools/places/) system

## Basics

### iD

* iD is a JavaScript [OpenStreetMap](http://www.openstreetmap.org/) editor.
* It's intentionally simple. It lets you do the most basic tasks while not breaking other people's data.
* It supports modern browsers. Data is rendered with [d3](http://d3js.org/).

### Places

* Places is an internal data management system for the National Park Service.
* It makes it possible for all National Park Service employees to contribute to their park's map.

## Installation

In order to make syncing with the [openstreetmap/iD](https://github.com/openstreetmap/iD) project easier, a prebuilt version of Places Editor is not available in this repository. You will need to build the project in order to use it.

## Building / Installing

You can build a concatenated and minified version of Places Editor with the command `make`. Node.js is required for this.

Places Editor will be built to the `dist` directory. This directory is designed to be self-contained; you should be able to copy it into the public directory of your web server to deploy it. This functionality will be improved in future releases, since we require Windows compatibility (no sym links) for our web server.

## License

iD is available under the [WTFPL](http://sam.zoy.org/wtfpl/). It includes [d3js](http://d3js.org/), which BSD-licensed. All contributions made to this forked repository are public domain.

## Thank you

Initial development of iD was made possible by a [grant of the Knight Foundation](http://www.mapbox.com/blog/knight-invests-openstreetmap/).
