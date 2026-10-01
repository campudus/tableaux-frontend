import i18n from "i18next";
import { ReactElement } from "react";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import ButtonAction, {
  ButtonActionOption
} from "../../helperComponents/ButtonAction";
import {
  Criterion,
  Direction,
  DirentOrder,
  toggleDirection
} from "./direntOrdering";

type DirentOrderControlProps = {
  className?: string;
  order: DirentOrder;
  onChange: (order: DirentOrder) => void;
};

const directionIcons: Record<Direction, string> = {
  asc: "fa-sort-amount-asc",
  desc: "fa-sort-amount-desc"
};

const criterionIcons = (direction: Direction): Record<Criterion, string> => ({
  "by-name": direction === "asc" ? "fa-sort-alpha-asc" : "fa-sort-alpha-desc",
  "by-type": "fa-file-image-o",
  "by-date": "fa-calendar"
});

const criterionLabelKeys: Record<Criterion, string> = {
  "by-name": "media:order_by_name",
  "by-type": "media:order_by_type",
  "by-date": "media:order_by_date"
};

const directionLabelKeys: Record<Direction, string> = {
  asc: "media:order_ascending",
  desc: "media:order_descending"
};

const criteria = Object.keys(criterionLabelKeys) as Criterion[];

export default function DirentOrderControl({
  className,
  order,
  onChange
}: DirentOrderControlProps): ReactElement {
  const iconOf = criterionIcons(order.direction);
  const iconFor = (criterion: Criterion) => (
    <i className={`icon fa ${iconOf[criterion]}`} />
  );
  const criterionOptions: ButtonActionOption[] = criteria.map(criterion => ({
    className: criterion === order.criterion ? "active" : undefined,
    icon: iconFor(criterion),
    label: i18n.t(criterionLabelKeys[criterion]),
    onClick: () => onChange({ ...order, criterion })
  }));

  return (
    <div className={cn("dirent-order-control", {}, className)}>
      <ButtonAction
        className="dirent-order-control_criterion-button"
        variant="outlined"
        alt={i18n.t("media:order_criterion_tooltip", {
          criterion: i18n.t(criterionLabelKeys[order.criterion])
        })}
        icon={iconFor(order.criterion)}
        label={i18n.t(criterionLabelKeys[order.criterion])}
        options={criterionOptions}
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
