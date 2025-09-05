import { ReactElement, useState } from "react";
import { Attachment } from "../../../types/grud";
import { setEmptyClassName } from "../helper";
import SvgIcon from "../../helperComponents/SvgIcon";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type AttachmentCellProps = {
  langtag: string;
  attachemnts: Attachment[] | undefined;
  link: string;
};

export default function AttachmentCell({
  langtag,
  attachemnts,
  link
}: AttachmentCellProps): ReactElement {
  const [open, setOpen] = useState(false);

  if (!attachemnts || attachemnts.length === 0) {
    return (
      <a
        className={`attachemnt-cell preview-cell-value-link ${setEmptyClassName()}`}
        href={link}
      >
        Leer
      </a>
    );
  }

  const pagination = {
    clickable: true,
    renderBullet: function(index: number, className: string) {
      return `<img class="${className}" src="/api${attachemnts[index]?.url[langtag]}" alt="thumb" />`;
    }
  };

  return (
    <>
      <button
        className="attachemnt-cell attachemnt-cell__link"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span>Bilder anzeigen ({attachemnts.length})</span>
      </button>

      {open && (
        <div className="attachment-slider-overlay">
          <div
            className="attachment-slider-backdrop"
            onClick={() => setOpen(false)}
          />

          <div className="attachment-slider-modal">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation={attachemnts.length > 1}
              pagination={attachemnts.length > 1 && pagination}
            >
              {attachemnts.map(att => (
                <SwiperSlide key={att.uuid}>
                  <div className="swiper-image-wrapper">
                    <img src={"/api" + att.url[langtag]} alt={"alt"} />

                    <div className="swiper-image-title">
                      {att.title[langtag]}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              className="attachment-slider-close"
              onClick={() => setOpen(false)}
            >
              <SvgIcon icon={"cross"} containerClasses={"color-white"} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
