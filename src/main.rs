#![windows_subsystem="windows"]
#[macro_use] extern crate sciter;
use sciter::Value;
use std::thread;

use rodio::source::{SineWave, Source};
use rodio::{OutputStream, Sink};
use std::time::Duration;

fn main() {
    sciter::set_options(sciter::RuntimeOptions::DebugMode(false)).unwrap();
    let archived = include_bytes!("../target/assets.rc");
    let mut frame = sciter::Window::new();
    frame.event_handler(EventHandler { });
    frame.archive_handler(archived).unwrap();
    frame.load_file("this://app/main.html");
    frame.run_app();
}

struct EventHandler {}
impl EventHandler {
    fn beep(&self, volume: f64, frequency: i32, duration: f64, callback: Value) -> () {
        thread::spawn(move || {
            beep(volume, frequency, duration);
            callback.call(None, &make_args!(), None).unwrap();
        });
    }
}

impl sciter::EventHandler for EventHandler {
  fn get_subscription(&mut self) -> Option<sciter::dom::event::EVENT_GROUPS> {
		Some(sciter::dom::event::default_events() | sciter::dom::event::EVENT_GROUPS::HANDLE_METHOD_CALL)
	}
  dispatch_script_call! (
    fn beep(f64, i32, f64, Value);
  );
}

fn beep(volume: f64, frequency: i32, duration: f64) {
    let (_stream, stream_handle) = OutputStream::try_default().unwrap();
    let sink = Sink::try_new(&stream_handle).unwrap();
    let source = SineWave::new(frequency as u32)
        .take_duration(Duration::from_secs_f64(duration))
        .amplify(volume as f32);
    sink.append(source);
    sink.sleep_until_end();
}
