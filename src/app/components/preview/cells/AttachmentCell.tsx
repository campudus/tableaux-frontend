import { ReactElement, useState } from "react";
import { Attachment } from "../../../types/grud";
import { getEmptyClassName } from "../helper";
import SvgIcon from "../../helperComponents/SvgIcon";
import i18n from "i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { isImageAttachment } from "../../../helpers/attachmentHelper";

type AttachmentCellProps = {
  langtag: string;
  attachments: Attachment[] | undefined;
  link: string;
};

export default function AttachmentCell({
  langtag,
  attachments,
  link
}: AttachmentCellProps): ReactElement {
  const [open, setOpen] = useState(false);
  const imageAttachments = attachments?.filter(att => isImageAttachment(att));
  const otherAttachments = attachments?.filter(att => !isImageAttachment(att));

  if (
    (!imageAttachments || imageAttachments.length === 0) &&
    (!otherAttachments || otherAttachments.length === 0)
  ) {
    return (
      <a className={`attachment-cell  ${getEmptyClassName()}`} href={link}>
        {i18n.t("preview:empty")}
      </a>
    );
  }

  const pagination = {
    clickable: true,
    renderBullet: function(index: number, className: string) {
      const images = imageAttachments ?? [];
      return `<img class="${className}" src="/api${images[index]?.url[langtag]}" alt="thumb" />`;
    }
  };

  return (
    <div className="attachment-cell">
      {imageAttachments && imageAttachments.length > 0 && (
        <>
          <button
            className="attachment-cell__images attachment-cell__images__link"
            onClick={() => setOpen(true)}
            type="button"
          >
            <span>
              {i18n.t("preview:show_images")} ({imageAttachments.length})
            </span>
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
                  navigation={!!imageAttachments && imageAttachments.length > 1}
                  pagination={
                    !!imageAttachments && imageAttachments.length > 1
                      ? pagination
                      : false
                  }
                >
                  {imageAttachments &&
                    imageAttachments.map(att => (
                      <SwiperSlide key={att.uuid}>
                        <div className="swiper-image-wrapper">
                          <img
                            src={"/api" + att.url[langtag]}
                            alt={att.title[langtag]}
                          />

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
      )}

      {otherAttachments && otherAttachments.length > 0 && (
        <a className="attachment-cell__others" href={link}>
          {otherAttachments.map((att, index) => (
            <>
              <div key={att.uuid}>
                <span>{att.title[langtag]}</span>
              </div>

              {index !== otherAttachments.length - 1 && (
                <span className="item-separator">&bull;</span>
              )}
            </>
          ))}
        </a>
      )}
    </div>
  );
}
