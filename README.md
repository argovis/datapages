# Datapages

Data visualizations for use with Argovis. Relies on https://github.com/argovis/argovis_api for data.

## Build & Release Cycle

Releases may be made with the following procedures, assuming the base image hasn't changed (see below for when base images need an update, ie when node or package dep versions change)

1. Choose a release tag; this should typically be a standard semver, possibly suffixed with `-rc-x` for release candidates if necessary.

2. Stamp a release of the `main` branch on GitHub, using the release tag you chose.

3. Build the API container: `docker image build -t argovis/datapages:<release tag> .`

4. Push to Docker Hub: `docker image push argovis/datapages:<release tag>`

### Base Image Builds

In general, the base image for the datapages shouldn't change often; it is meant to capture package dependencies, and should be as stable as possible. But, when dependencies need an update (most typically after `package.json` changes), follow this procedure.

1. Build a new base image, tagged with the build date:  `docker image build -f Dockerfile-base -t argovis/datapages:base-yymmdd .`

2. Update `Dockerfile` to build from your new base image (second `FROM` line, marked `as head`).

2. Push to Docker Hub: `docker image push argovis/datapages:base-yymmdd`, and push the updates to the `main` branch to GitHub.