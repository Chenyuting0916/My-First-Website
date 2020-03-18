<?php
 	include("connect1.php");
	
	$var0 = $_SERVER["REMOTE_ADDR"];
	date_default_timezone_set("Asia/Taipei");
	$var1 = date("Y-m-d H:i:s");

	$sql = "SELECT * FROM people ORDER BY id DESC";	
	$result = $conn -> query($sql);
	
	
	$rtnData = array();
	if($result -> num_rows > 0) {
		while($row = $result -> fetch_assoc()) {
			$data = array();
			array_push($data, $row["id"]);
			array_push($data, $row["ip"]);
			array_push($rtnData, $data);
		}
	}
	
	$num = ++$rtnData[0][0];
	$sql = "INSERT INTO people VALUES(" . $num . ", '" . $var0 . "','" . $var1 . "', 0)";
	$conn -> query($sql);

	$conn -> close();

	$rtnData = array();
	$rtnData[0] = $num;
	$rtnData[1] = $var1;
	echo json_encode($rtnData);
?>