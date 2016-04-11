export function getKeyboardShortcuts() {
  var self = this;

  //Force the next selected cell to be focused
  if (!this.shouldCellFocus()) {
    this.enableShouldCellFocus();
  }
  return {
    left(event) {
      event.preventDefault();
      self.preventSleepingOnTheKeyboard(() => {
          self.setNextSelectedCell(Directions.LEFT);
        }
      );
    },
    right(event) {
      event.preventDefault();
      self.preventSleepingOnTheKeyboard(() => {
          self.setNextSelectedCell(Directions.RIGHT);
        }
      );
    },
    tab(event) {
      event.preventDefault();
      self.preventSleepingOnTheKeyboard(() => {
          self.setNextSelectedCell(Directions.RIGHT);
        }
      );
    },
    up(event) {
      event.preventDefault();
      self.preventSleepingOnTheKeyboard(() => {
          self.setNextSelectedCell(Directions.UP);
        }
      );
    },
    down(event) {
      event.preventDefault();
      self.preventSleepingOnTheKeyboard(() => {
          self.setNextSelectedCell(Directions.DOWN);
        }
      );
    },
    enter(event) {
      event.preventDefault();
      self.preventSleepingOnTheKeyboard(() => {
          if (self.state.selectedCell && !self.state.selectedCellEditing) {
            self.toggleCellEditing();
          }
        }
      );
    },
    escape(event) {
      event.preventDefault();
      self.preventSleepingOnTheKeyboard(() => {
          if (self.state.selectedCell && self.state.selectedCellEditing) {
            self.toggleCellEditing({editing : false});
          }
        }
      );
    },
    text(event) {
      if (self.state.selectedCell && !self.state.selectedCellEditing
        && (self.state.selectedCell.kind === ColumnKinds.text
        || self.state.selectedCell.kind === ColumnKinds.shorttext
        || self.state.selectedCell.kind === ColumnKinds.numeric)) {
        self.toggleCellEditing();
      }
    }
  };
}