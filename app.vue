<template>
  <div class="container">
    <thead>Отель и номер</thead>
    <th class="current-month">{{ Months[currentMonth] }}</th>
    <table v-for="(hotel, hotelName) in days" :key="hotelName">
      <thead>
        <th class="hotel-name">{{ hotelName }}</th>
        <th v-for="(day, key, index) in days[hotelName][1]" :key="index">
          <span>{{day.day}}</span>
          <span>{{ day.week_day }}</span>
        </th>
      </thead>
      <tbody>
        <tr v-for="(rooms, roomNumber) in days[hotelName]" :key="rooms.number">
          <td>{{ `#${roomNumber}(${rooms[roomNumber].price}Р/сутки)` }}</td>
          <td v-for="(day, key, index) in days[hotelName][roomNumber]" :key="index"
            :data-day = day.day
            :data-price = rooms[roomNumber].price
            :data-hotel = hotelName
          >
            <span v-if="day.booked" class="booked" :style="{ 
                                                              width: `${day.duration*100+15}%`,
                                                            }"
              @mousedown="handleMouseDown($event)"
              @mouseup="stopMove($event)">
              {{`Бронь #143 Оплата: ${bookedRoomPrice} Отель: ${bookedHotel}`}}<br/>
              {{`${bookedDay - bookingDuration+1} ${shortMonth} - ${bookedDay} ${shortMonth}`}}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { hotels } from './hotels';
  export default {
    name: 'App',
    data: () => ({
      MonthDaysCount: '0',
      hotels: hotels,
      currentMonth: new Date().getMonth(),
      Months: [ 'January', 'February', 'March', 
                'April', 'May', 'June', 'July', 
                'August', 'September', 'October', 
                'November', 'December'
              ],
      weekdays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
      days: [],
      timetable: {},
      shortMonth: null,
      reservation: null,
      cellWidth: 50,
      startCell: null,
      stopedCell: null,
      bookedRoomPrice: null,
      bookedDay: null,
      bookingDuration: 8,
      bookedHotel: null,
      pageHeight: null,
    }),
    created() {
      this.calculateMonthDays();
    },
    mounted() {
      this.days = this.$store.getters.hotelsInfo;
      this.shortMonth = this.Months[this.currentMonth].slice(0,3);
      this.pageHeight = document.documentElement.clientHeight;
    },
    methods: {
      calculateMonthDays() {
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getUTCMonth();
        let first_day = new Date(year, month, 1) //устанавливаем дату первого числа текущего месяца
        let first_weekDay = first_day.getDay();
        let oneHour = 1000 * 60 * 60;
        let oneDay = oneHour * 24;
        let nextMonth = new Date(year, month + 1, 1);
        let MonthDaysCount = Math.ceil((nextMonth.getTime() - first_day.getTime() - oneHour) / oneDay) // вычисляем крайний день текущего месяца
        this.MonthDaysCount = MonthDaysCount;
        this.handleSaveDays(MonthDaysCount, hotels, first_weekDay);
      },
      handleSaveDays(days, hotels, first_weekDay){
        let week_day = first_weekDay;
        for (let i = 0; i < hotels.length; i++) {
          for(let z = 0; z < hotels[i].rooms.length; z++){
            for (let j = 1; j < days+1; j++) {
              week_day == 7 ? week_day = 0 : week_day;
              let hotel = hotels[i];
              let room = hotel.rooms[z];
              if (!this.timetable[hotel.name]){
                this.timetable[hotel.name] = {}
                this.timetable[hotel.name][room.number] = [];
                this.handleAddRoomData(hotel, room, week_day, j)
              } else if (!this.timetable[hotel.name][room.number]) {
                this.handleAddRoomData(hotel, room, week_day, j)
              } else {
                this.handlePushRoomData(hotel, room, week_day, j)
              }
              week_day += 1;
            }
          }
        }
        this.$store.commit('saveInfo', this.timetable);
      },
      handleAddRoomData(hotel, room, week_day, j) {
        if (hotel.name == 'Pushkino' && j == 16 && room.number == 1) {
          this.bookedRoomPrice = room.price;
          this.bookedDay = j;
          this.bookedHotel = hotel.name;
          this.timetable[hotel.name][room.number] = [{
            hotel: hotel.name,
            day: j,
            booked: true,
            week_day: this.weekdays[week_day],
            duration: this.bookingDuration,
            price: room.price }]
        } else {
          this.timetable[hotel.name][room.number] = [{
            hotel: hotel.name,
            day: j, 
            booked: false,
            week_day: this.weekdays[week_day],
            price: room.price  }]
        }
      },
      handlePushRoomData(hotel, room, week_day, j) {
        if (hotel.name == 'Pushkino' && j == 16 && room.number == 1) {
          this.bookedRoomPrice = room.price;
          this.bookedDay = j;
          this.bookedHotel = hotel.name;
          this.timetable[hotel.name][room.number].push({
            hotel: hotel.name,
            day: j,
            booked: true,
            week_day: this.weekdays[week_day],
            duration: this.bookingDuration,
            price: room.price })
        } else {
          this.timetable[hotel.name][room.number].push({
            hotel: hotel.name,
            day: j,
            booked: false,
            week_day: this.weekdays[week_day],
            price: room.price })
        }
      },
      handleMouseDown(event) {
        if (event.which != 1) {
          return;
        }
        this.reservation = event.target;
        this.reservation.classList.add('grabbing');
        let coords = this.getCoords(this.reservation);
        let shiftX = event.pageX - coords.left;
        let shiftY = event.pageY - coords.top;
        this.saveStartCell()
        this.moveAt(event, shiftX, shiftY, coords)
        document.onmousemove = (ev) => this.moveAt(ev, shiftX, shiftY, coords);
        this.reservation.onmouseup = (ev) => this.stopMove(ev)
        document.onmouseup = (e) => this.stopMove(e);
      },
      saveStartCell() {
        this.startCell = this.reservation.parentNode;
        this.stopedCell = null;
      },
      getCoords(elem) {
        let box = elem.getBoundingClientRect();
        return {
          top: box.top ,
          left: box.left,
          width: box.width,
          right: box.right,
          bottom: box.bottom,
        };
      },
      moveAt(ev, shiftX, shiftY, coords) {
        this.reservation.style.left = ev.pageX - shiftX - coords.left - coords.width + this.cellWidth-10 + "px";
        this.reservation.style.top = ev.pageY - shiftY - coords.top + "px";
        this.handlePageScroll();
      },
      handlePageScroll() {
        const coords = this.getCoords(this.reservation)
        if (!this.pageScrolledToEnd() && coords.bottom >= this.pageHeight) {
          window.scrollBy(0,15)
        }
        if (coords.top <= 0) {
          window.scrollBy(0,-15)
        }
      },
      pageScrolledToEnd() {
        const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight
        const currentScroll = window.pageYOffset
        return currentScroll >= maxScroll-45
      },
      stopMove(event) {
        const coords = this.getCoords(event.target)
        const stopedPosition = document.elementFromPoint(coords.right, coords.top)
        if (stopedPosition && stopedPosition.dataset.hotel) {
          if (!this.stopedCell) {
            this.stopedCell = stopedPosition;
            this.changeBooking(event)
          }
        }else {
          this.returnToStartPosition()
        }
        this.reservation.classList.remove('grabbing');
        document.onmousemove = null;
        this.reservation.onmouseup = null;
        document.onmouseup = null;
      },
      changeBooking(event) {
        const childElem = this.startCell.firstChild
        if (childElem) {
          this.startCell.removeChild(childElem);
        }
        if (!this.stopedCell.dataset.day || this.stopedCell.dataset.day - this.bookingDuration < 1) {
          const bookingDate = document
            .querySelector(`td[data-day="${this.bookingDuration}"][data-price="${this.stopedCell.dataset.price}"][data-hotel="${this.stopedCell.dataset.hotel}"]`);
          console.log(bookingDate);
          bookingDate.appendChild(this.reservation)
          this.bookedRoomPrice = bookingDate.dataset.price
          this.bookedDay = bookingDate.dataset.day;
          this.bookedHotel = bookingDate.dataset.hotel
        } else {
          this.stopedCell.appendChild(this.reservation);
          this.bookedRoomPrice = this.stopedCell.dataset.price;
          this.bookedDay = this.stopedCell.dataset.day;
          this.bookedHotel = this.stopedCell.dataset.hotel
        }
        this.returnToStartPosition()
      },
      returnToStartPosition() {
        this.reservation.style.right = 0;
        this.reservation.style.top = 0;
        this.reservation.style.left = 'inherit'
      }
    },
  }
</script>

<style scoped>
/* .container {
  user-select: none;
} */
th {
  background: #dedede;
  border-top: 1px solid #000;
  border-left: 1px solid #000;
  width: 50px;
  font-size: 14px;
  user-select: none;
}
td {
  background: #94F0F8 ;
  border-top: 1px solid #000;
  border-left: 1px solid #000;
  position: relative;
  width: 50px;
  margin: 0;
  padding: 0;
  user-select: none;
}
table {
  border-spacing: 0;
}
tbody {
  font-size: 14px;
}
tr {
  border: none;
  height: 40px;
  min-height: 40px;
}
.current-month {
  width: 100%;
  display: block;
}
.hotel-name {
  width: 50px;
  word-break: break-all;
}
.booked {
  background: lawngreen;
  width: 100%;
  height: 39px;
  display: block;
  position: absolute;
  top: 0;
  cursor: grab;
  border-radius: 0.2em;
  z-index: 2;
  right: 0;
}
.grabbing {
  cursor: grabbing;
}
</style>
