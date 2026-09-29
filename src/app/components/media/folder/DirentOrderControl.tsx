import i18n from "i18next";
import { ReactElement } from "react";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import ButtonAction from "../../helperComponents/ButtonAction";
import {
  Criterion,
  Direction,
  DirentOrder,
  nextCriterion,
  toggleDirection
} from "./direntOrdering";

type DirentOrderControlProps = {
  className?: string;
  order: DirentOrder;
  onChange: (order: DirentOrder) => void;
};

const criterionIcons: Record<Criterion, string> = {
  "by-name": "fa-font",
  "by-type": "fa-file-o",
  "by-date": "fa-clock-o"
};

const directionIcons: Record<Direction, string> = {
  asc: "fa-sort-amount-asc",
  desc: "fa-sort-amount-desc"
};

const criterionLabelKeys: Record<Criterion, string> = {
  "by-name": "media:order_by_name",
  "by-type": "media:order_by_type",
  "by-date": "media:order_by_date"
};

const directionLabelKeys: Record<Direction, string> = {
  asc: "media:order_ascending",
  desc: "media:order_descending"
};

export default function DirentOrderControl({
  className,
  order,
  onChange
}: DirentOrderControlProps): ReactElement {
  return (
    <div className={cn("dirent-order-control", {}, className)}>
      <ButtonAction
        variant="outlined"
        icon={<i className={`icon fa ${criterionIcons[order.criterion]}`} />}
        alt={i18n.t("media:order_criterion_tooltip", {
          criterion: i18n.t(criterionLabelKeys[order.criterion])
        })}
        onClick={() => onChange(nextCriterion(order))}
      />
      <ButtonAction
        variant="outlined"
        icon={<i className={`icon fa ${directionIcons[order.direction]}`} />}
        alt={i18n.t(directionLabelKeys[order.direction])}
        onClick={() => onChange(toggleDirection(order))}
      />
    </div>
  );
}
