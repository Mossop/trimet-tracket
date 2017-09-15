import React from "react";

import Arrival from "./arrival.jsx";

class Stop extends React.Component {
  constructor(props) {
    super(props);

    this.deleteStop = this.deleteStop.bind(this);
  }

  deleteStop() {
    this.props.port.postMessage({
      message: "removeStop",
      data: parseInt(this.props.stop.id),
    });
  }

  render() {
    let arrivals = this.props.stop.arrivals.filter((a, i) => i < 3);
    let blanks = [];
    for (let i = arrivals.length; i < 3; i++) {
      blanks.push(null);
    }

    return (
      <tbody>
        <tr>
          <td className="stopName" colSpan="3">{this.props.stop.name}</td>
          <td className="deleteCell" rowSpan="2">
            <button type="button" className="delete" onClick={this.deleteStop}>X</button>
          </td>
        </tr>
        <tr>
          {arrivals.map((arrival, i) =>
            <Arrival key={i} arrival={arrival}/>
          )}
          {blanks.map((blank, i) =>
            <td></td>
          )}
        </tr>
      </tbody>
    );
  }
}

export default Stop;