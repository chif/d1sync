// @flow
import React from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import ContentLoader from 'react-content-loader';

type Props = {
  branchName: string;
  buildName: string;
  bIsImportant: boolean;
  playtestTitle: string;
  playtestDesc: string;
  bPlaceholder: boolean;
};

const cardLoader = (linesCount = 1) => {
  const children: Array<JSX.Element> = [];
  let height = 0;
  const wordsCount = Math.round(Math.random() * 6) + 1;
  let maxWidth = 32;

  for (let lineIndex = 0; lineIndex < linesCount; lineIndex++) {
    const rowHeight = 11;
    const padding = 6;
    let lineWidth = 0;
    const wordSpacing = 8;
    for (let wordIndex = 0; wordIndex < wordsCount; wordIndex++) {
      const wordWidth = Math.round(Math.random() * 80) + 16;
      children.push(
        <rect
          x={lineWidth}
          y={(rowHeight + padding) * lineIndex}
          rx="3"
          ry="3"
          width={wordWidth}
          height={rowHeight}
        />
      );
      lineWidth += wordWidth + wordSpacing;
    }

    maxWidth = Math.max(lineWidth, maxWidth);
    height += rowHeight + padding;
  }

  const viewBox = `0 0 ${maxWidth} ${height}`;
  return (
    <ContentLoader
      speed={1}
      width={maxWidth}
      height={height}
      viewBox={viewBox}
      backgroundColor="#a0a0a0"
      foregroundColor="#fafafa"
    >
      {children}
    </ContentLoader>
  );
};

const BuildComponent: React.FC<Props> = props => {
  const {
    branchName,
    buildName,
    bIsImportant,
    playtestTitle,
    playtestDesc,
    bPlaceholder
  } = props;

  const border: string =
    !bPlaceholder && bIsImportant ? 'warning' : 'secondary';
  const branchBadge: string = branchName === 'Master' ? 'info' : 'light';

  const getBadges = () => {
    if (!bPlaceholder && bIsImportant) {
      return (
        <Badge pill variant="warning">
          !
        </Badge>
      );
    }

    return <span />;
  };

  const getButtons = () => {
    if (bPlaceholder) {
      return <></>;
    }

    return (
      <div>
        <Button className="mr-3" variant="primary">
          Start
        </Button>
        <Button variant="secondary">
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      </div>
    );
  };

  const getHeader = () => {
    if (bPlaceholder) {
      return cardLoader(1);
    }
    return (
      <>
        <Badge variant={branchBadge}>{branchName}</Badge>
        <span className="m-1">{buildName}</span>
        {getBadges()}
      </>
    );
  };

  const getContent = () => {
    if (bPlaceholder) {
      return (
        <>
          <Card.Title>{cardLoader(1)}</Card.Title>
          <Card.Text>{cardLoader(4)}</Card.Text>
        </>
      );
    }

    return (
      <>
        <Card.Title>{playtestTitle}</Card.Title>
        <Card.Text>{playtestDesc}</Card.Text>
        {getButtons()}
      </>
    );
  };

  return (
    <Card border={border} className="m-2">
      <Card.Header>
        <h5>{getHeader()}</h5>
      </Card.Header>
      <Card.Body>{getContent()}</Card.Body>
    </Card>
  );
};

export default BuildComponent;
