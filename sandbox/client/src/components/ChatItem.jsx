export default function ChatItem(props) {
    const { message, username } = props
    // console.log(username)
    return (
        <>
        {/* Received message */}
        <div className="d-flex mb-3">
          <span>{username}</span>
          <div>
            <div className="message-bubble received shadow-sm">
              {message}
            </div>
            {/* <small className="text-muted ms-2">10:00 AM</small> */}
          </div>
        </div>
        {/* Sent message */}
        {/* <div className="d-flex justify-content-end mb-3">
          <div className="text-end">
            <div className="message-bubble sent shadow-sm">
              I'm good, thank you!
            </div>
            <small className="text-muted">10:01 AM</small>
          </div>
          <img
            src="https://via.placeholder.com/32"
            className="rounded-circle ms-2"
            alt="You"
          />
        </div> */}
        </>
    )
}