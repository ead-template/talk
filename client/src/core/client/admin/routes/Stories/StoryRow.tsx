import { Localized } from "@fluent/react/compat";
import cn from "classnames";
import { Link } from "found";
import React, { FunctionComponent } from "react";

import NotAvailable from "coral-admin/components/NotAvailable";
import { getModerationLink } from "coral-framework/helpers";
import { PropTypesOf } from "coral-framework/types";
import {
  ButtonSvgIcon,
  NavigationMenuHorizontalIcon,
} from "coral-ui/components/icons";
import {
  Button,
  HorizontalGutter,
  TableCell,
  TableRow,
  TextLink,
} from "coral-ui/components/v2";

import StoryStatusContainer from "./StoryStatus";

import styles from "./StoryRow.css";

interface Props {
  storyID: string;
  title: string | null;
  author: string | null;
  readOnly: boolean;
  publishDate: string | null;
  story: PropTypesOf<typeof StoryStatusContainer>["story"];
  siteName: string;
  siteID: string;
  multisite: boolean;
  reportedCount: number | null;
  pendingCount: number | null;
  totalCount: number;
  viewerCount: number | null;
  onOpenInfoDrawer: () => void;
}

const UserRow: FunctionComponent<Props> = (props) => (
  <TableRow>
    <TableCell className={styles.titleColumn}>
      <HorizontalGutter>
        <p>
          {!props.readOnly ? (
            <Link
              to={getModerationLink({ storyID: props.storyID })}
              as={TextLink}
            >
              {props.title || <NotAvailable />}
            </Link>
          ) : (
            props.title || <NotAvailable />
          )}
        </p>
        {(props.author || props.publishDate || !!props.viewerCount) && (
          <p className={styles.meta}>
            {!!props.author && (
              <span className={cn(styles.authorName, styles.metaElement)}>
                {props.author}
              </span>
            )}

            {!!props.publishDate && (
              <span className={styles.metaElement}>{props.publishDate} </span>
            )}

            {!!props.viewerCount && (
              <span className={styles.readingNow}>
                {props.viewerCount} reading now
              </span>
            )}
          </p>
        )}
      </HorizontalGutter>
    </TableCell>
    <TableCell
      className={cn(styles.reportedCountColumn, {
        [styles.boldColumn]: props.reportedCount && props.reportedCount > 0,
      })}
    >
      {props.reportedCount}
    </TableCell>
    <TableCell
      className={cn(styles.pendingCountColumn, {
        [styles.boldColumn]: props.pendingCount && props.pendingCount > 0,
      })}
    >
      {props.pendingCount}
    </TableCell>
    <TableCell
      className={cn(styles.totalCountColumn, {
        [styles.boldColumn]: props.totalCount && props.totalCount > 0,
      })}
    >
      {props.totalCount}
    </TableCell>
    <TableCell className={styles.statusColumn}>
      <StoryStatusContainer story={props.story} />
    </TableCell>
    <TableCell className={styles.actionsColumn}>
      {!props.readOnly && (
        <Localized id="stories-openInfoDrawer" attrs={{ "aria-label": true }}>
          <Button
            aria-label="Open Info Drawer"
            onClick={props.onOpenInfoDrawer}
            color="mono"
            variant="text"
            uppercase={false}
          >
            {
              <ButtonSvgIcon
                size="xs"
                filled
                Icon={NavigationMenuHorizontalIcon}
              />
            }
          </Button>
        </Localized>
      )}
    </TableCell>
  </TableRow>
);

export default UserRow;
