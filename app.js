require("dotenv").config();

const express = require("express");
const hbs = require("hbs");

// require spotify-web-api-node package here:
const SpotifyWebApi = require("spotify-web-api-node");

const app = express();

app.set("view engine", "hbs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));

// setting the spotify-api goes here:
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});

// Retrieve an access token
spotifyApi
  .clientCredentialsGrant()
  .then((data) => spotifyApi.setAccessToken(data.body["access_token"]))
  .catch((error) => console.log("Something went wrong when retrieving an access token", error));

// Our routes go here:
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/artist-search", (req, res) => {
  const currentPage = req.query.page ? parseInt(req.query.page) : 1;

  // let  currentPage = req.query.page || 0;
  // currentPage = parseInt(currentPage)

  const paginationData = {
    limit: 20,
    offset: currentPage * 20,
  };

  const linkPrev = `?artist=${req.query.artist}&page=${currentPage - 1}`;
  const linkNext = `?artist=${req.query.artist}&page=${currentPage + 1}`;

  spotifyApi
    .searchArtists(req.query.artist, { limit: paginationData.limit, offset: paginationData.offset })
    .then((data) => {
      console.log("CURRENT PAGE", currentPage);
      console.log("QUERY", req.query);
      //console.log("The received data from the API: ", data.body);

      const filteredArtistsArr = data.body.artists.items.filter((elm) => {
        return req.query.artist ? elm.name.toLowerCase().includes(req.query.artist.toLowerCase()) : true;
      });
      // console.log("FILTERED", filteredArtistsArr);
      // console.log("FILTERED", filteredArtistsArr[0].images[2].url);

      res.render("artist-search-results", { filteredArtistsArr, linkPrev, linkNext, currentPage });
    })
    .catch((err) => console.log("The error while searching artists occurred: ", err));
});

app.get("/albums/:artistId", (req, res, next) => {
  spotifyApi
    .getArtistAlbums(req.params.artistId)
    .then((data) => {
      const albumData = {
        albumsArray: data.body.items,
        artist: data.body.items[0].artists[0].name,
        artistId: data.body.items[0].artists[0].id,
      };
      // console.log("ALBUMS ARRAY", albumData.albumsArray);
      res.render("albums", albumData);
    })
    .catch((err) => console.log("error occured while searching for albums", err));
});

app.get("/albums/:artistId/:albumId", (req, res, next) => {
  console.log("REQ", req.params);
  spotifyApi
    .getAlbumTracks(req.params.albumId)
    .then((data) => {
      const tracksData = {
        tracksArray: data.body.items,
      };
      console.log("ONE ALBUM", data.body.items);
      res.render("tracks", tracksData);
    })
    .catch((err) => console.log("error looking for specific album", err));
});

app.listen(3005, () => console.log("My Spotify project running on port 3005 🎧 🥁 🎸 🔊"));
