import React, { Component } from "react";
import {
  FacebookShareButton,
  TwitterShareButton,
  FacebookIcon,
  TwitterIcon,
  LineShareButton,
  LineIcon
} from "react-share";

const Share = ({ location}) => {
  const url = location.href;
  // const iconSize = mobile ? 36 : 48;
  const iconSize = 36;

  return (
    <div className="social-links" style={{ textAlign: "right"}}>
      <TwitterShareButton url={url} via="@yoshixj">
        <TwitterIcon round size={iconSize} />
      </TwitterShareButton>
      <FacebookShareButton url={url} style={{ marginLeft: '1.2em' }}>
        <FacebookIcon round size={iconSize} />
      </FacebookShareButton>
      <LineShareButton url={url} style={{ marginLeft: '1.2em' }}>
        <LineIcon round size={iconSize} />
      </LineShareButton>
    </div>
  );
}

export default Share;